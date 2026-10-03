import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import type { OrgAdminRoleV3 } from './accountTypes'

/**
 * Organisation staff roster and invitations, server-side (public.org_staff, RLS-enforced).
 * An organisation administrator invites people by email and role; the invitation is delivered in-app (a notification plus the
 * Workspaces page), and the person accepts or declines. Accepted staff act for the organisation through their own login, and
 * what they may do is decided by the database per role. There is no email delivery on this deployment.
 */
export type OrgStaffStatus = 'invited' | 'active' | 'declined' | 'revoked'

export interface OrgStaffRecord {
  id: string
  orgEmail: string
  staffEmail: string
  role: OrgAdminRoleV3
  status: OrgStaffStatus
  invitedAt: string
  respondedAt: string | null
}

interface Row {
  id: string
  org_email: string
  staff_email: string
  role: OrgAdminRoleV3
  status: OrgStaffStatus
  invited_at: string
  responded_at: string | null
}

export const MAX_STAFF = 20

export const ACCESS_LABEL: Record<OrgAdminRoleV3, string> = {
  super_admin: 'Full access',
  admin: 'Full access (non-billing)',
  verification_officer: 'Verification only',
  hr_manager: 'Hiring only',
  credential_manager: 'Credential issuance only',
  moderator: 'Content moderation only',
  compliance_officer: 'Audit & compliance only',
}

const toRecord = (r: Row): OrgStaffRecord => ({ id: r.id, orgEmail: r.org_email, staffEmail: r.staff_email, role: r.role, status: r.status, invitedAt: r.invited_at, respondedAt: r.responded_at })

let cache: Row[] = []
let version = 0
const listeners = new Set<() => void>()
const notify = () => {
  version++
  listeners.forEach((fn) => fn())
}

async function load() {
  const { data, error } = await supabase.from('org_staff').select('*')
  if (!error) cache = (data as Row[]) ?? []
  notify()
}

if (typeof window !== 'undefined') {
  void load()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load()
  })
  joinRealtime(() =>
    supabase
      .channel('org-staff')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'org_staff' }, () => void load())
      .subscribe(),
  )
}

export function useOrgStaffVersion(): number {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => version,
    () => version,
  )
}

/** The roster an organisation administrator manages: people invited or active (history of declined/removed is kept in the audit trail). */
export function listStaffFor(orgEmail: string): OrgStaffRecord[] {
  const e = orgEmail.toLowerCase()
  return cache
    .filter((r) => r.org_email.toLowerCase() === e && (r.status === 'invited' || r.status === 'active'))
    .map(toRecord)
    .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))
}

export function listMyInvitations(myEmail: string): OrgStaffRecord[] {
  const e = myEmail.toLowerCase()
  return cache.filter((r) => r.staff_email === e && r.status === 'invited').map(toRecord)
}

export function listMyMemberships(myEmail: string): OrgStaffRecord[] {
  const e = myEmail.toLowerCase()
  return cache.filter((r) => r.staff_email === e && r.status === 'active').map(toRecord)
}

export interface InviteResult {
  invited: string[]
  skipped: string[]
  invalid: string[]
}

/** Invites a comma-separated list of emails into one role. Skips anyone already on the roster, and stops at the staff limit. */
export async function inviteStaffBulk(emailsInput: string, role: OrgAdminRoleV3): Promise<InviteResult> {
  const emails = emailsInput
    .split(/[,;\s]+/)
    .map((e) => e.trim())
    .filter(Boolean)
  const { data, error } = await supabase.rpc('org_invite_staff', { p_emails: emails, p_role: role })
  if (error) throw new Error(error.message)
  await load()
  return data as InviteResult
}

/** Removes someone from the roster (an administrator), or leaves (the person themselves). */
export async function endMembership(id: string): Promise<void> {
  const { error } = await supabase.rpc('org_end_membership', { p_id: id })
  if (error) throw new Error(error.message)
  await load()
}

export const revokeStaff = endMembership

export async function respondToInvitation(id: string, accept: boolean): Promise<void> {
  const { error } = await supabase.rpc('org_respond_invite', { p_id: id, p_accept: accept })
  if (error) throw new Error(error.message)
  await load()
}
