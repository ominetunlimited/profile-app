/**
 * Real Admin Centre backend — `public.platform_admins` (RLS: a user can
 * always read their own row; only `super_administrator` can read/manage the
 * full roster). This is deliberately separate from `demoAccountStore.ts`'s
 * `accounts` table and from `AccountContext`'s `staffRole`: PROFILE staff
 * aren't content-posting individual/organisation accounts, matching a
 * WordPress wp-admin vs. public-site-user split. See
 * supabase/migrations/0005_platform_admins.sql for the schema/RLS.
 *
 * §37.6 PlatformRole, verbatim, plus `verification_officer` (named in §42.2
 * for org admins, reused here since the Master Prompt doesn't define a
 * distinct platform-staff verification role of its own).
 */
import { supabase } from './supabaseClient'

export type PlatformRole = 'super_administrator' | 'admin' | 'moderator' | 'customer_support' | 'compliance_officer' | 'verification_officer'

export const PLATFORM_ROLES: PlatformRole[] = ['super_administrator', 'admin', 'moderator', 'customer_support', 'compliance_officer', 'verification_officer']

export const PLATFORM_ROLE_LABEL: Record<PlatformRole, string> = {
  super_administrator: 'Super Administrator',
  admin: 'Admin',
  moderator: 'Moderator',
  customer_support: 'Customer Support',
  compliance_officer: 'Compliance Officer',
  verification_officer: 'Verification Officer',
}

export interface PlatformAdmin {
  id: string
  email: string
  displayName: string | null
  role: PlatformRole
  status: 'active' | 'revoked'
  createdAt: string
  createdBy: string | null
}

interface PlatformAdminRow {
  id: string
  email: string
  display_name: string | null
  role: PlatformRole
  status: 'active' | 'revoked'
  created_at: string
  created_by: string | null
}

function rowToAdmin(r: PlatformAdminRow): PlatformAdmin {
  return { id: r.id, email: r.email, displayName: r.display_name, role: r.role, status: r.status, createdAt: r.created_at, createdBy: r.created_by }
}

/**
 * §26/§37.11's `ADMIN_MODULES`/`ADMIN_MODULES_V3` list 17 modules total —
 * this is a realistic v1 slice (the screens this build actually migrates
 * onto the real gate), not the full list. Extending the Admin Centre later
 * means adding a module key here, not redesigning the permission system.
 * The exact role→module defaults below aren't specified anywhere in the
 * Master Prompt for these four modules — chosen to keep "manage other
 * admins' roles" exclusive to super_administrator (matching the user's own
 * emphasis on one master admin), and verification/compliance roles scoped
 * to verification work rather than given blanket access.
 */
export type AdminModule = 'user_role_management' | 'verification_queue' | 'content_moderation' | 'mission_control' | 'data_requests' | 'platform_settings'

export const PLATFORM_PERMISSION_MATRIX: Record<PlatformRole, AdminModule[]> = {
  super_administrator: ['user_role_management', 'verification_queue', 'content_moderation', 'mission_control', 'data_requests', 'platform_settings'],
  admin: ['verification_queue', 'content_moderation', 'mission_control', 'data_requests', 'platform_settings'],
  moderator: ['content_moderation'],
  customer_support: ['content_moderation'],
  compliance_officer: ['verification_queue', 'mission_control', 'data_requests'],
  verification_officer: ['verification_queue'],
}

export function platformRoleCan(role: PlatformRole, module: AdminModule): boolean {
  return PLATFORM_PERMISSION_MATRIX[role].includes(module)
}

/** Looks up whether the CURRENTLY AUTHENTICATED Supabase session belongs to
 * a platform admin — returns null for any ordinary consumer account/session,
 * never throws. This is the one real source of truth AdminContext uses;
 * nothing here depends on (or touches) AccountContext's `staffRole`. */
export async function fetchMyPlatformAdmin(): Promise<PlatformAdmin | null> {
  const { data: sessionData } = await supabase.auth.getSession()
  const uid = sessionData.session?.user?.id
  if (!uid) return null
  const { data } = await supabase.from('platform_admins').select('*').eq('id', uid).maybeSingle()
  if (!data) return null
  const admin = rowToAdmin(data as PlatformAdminRow)
  return admin.status === 'active' ? admin : null
}

/** Super-admin-only: the full roster, for the Users & Roles screen. RLS
 * returns an empty list (not an error) for anyone else. */
export async function listPlatformAdmins(): Promise<PlatformAdmin[]> {
  const { data } = await supabase.from('platform_admins').select('*').order('created_at', { ascending: true })
  return (data ?? []).map((r) => rowToAdmin(r as PlatformAdminRow))
}

/**
 * Invites a new admin by email: creates a real Supabase Auth user (via the
 * `/api/admin-invite` serverless function, since creating an arbitrary auth
 * user needs the service_role key, which must never reach the browser) and
 * the matching `platform_admins` row. Returns the temporary password so the
 * inviter can hand it to the new admin out of band — it is never stored
 * anywhere after this call returns.
 */
export async function invitePlatformAdmin(email: string, role: PlatformRole, displayName: string): Promise<{ temporaryPassword: string }> {
  const {
    data: { session },
  } = await supabase.auth.getSession()
  const res = await fetch('/api/admin-invite', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session?.access_token ?? ''}` },
    body: JSON.stringify({ email, role, displayName }),
  })
  const body = await res.json()
  if (!res.ok) throw new Error(body.error ?? 'Could not invite admin')
  return { temporaryPassword: body.temporaryPassword }
}

export async function updatePlatformAdminRole(id: string, role: PlatformRole): Promise<void> {
  const { error } = await supabase.from('platform_admins').update({ role }).eq('id', id)
  if (error) throw error
}

export async function setPlatformAdminStatus(id: string, status: 'active' | 'revoked'): Promise<void> {
  const { error } = await supabase.from('platform_admins').update({ status }).eq('id', id)
  if (error) throw error
}
