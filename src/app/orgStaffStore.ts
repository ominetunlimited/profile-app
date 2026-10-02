import { emitEvent } from './eventBus'
import type { OrgAdminRoleV3 } from './accountTypes'

/**
 * §42.1/§42.3 Organisation staff roster — design handoff gap audit:
 * Organization/Institution/Government Workspace mockups all show a real
 * "Staff & roles" bulk-invite UI + staff table; the real build only ever
 * said "inviting staff requires a matching-email registration flow not
 * yet built." This is that real, local, persisted roster.
 *
 * Deliberate substitution from the mockup, flagged rather than silently
 * copied: the mockup's own role dropdown (Viewer/Reviewer/Recruiter/
 * Admin) is a simplified, illustrative list that doesn't correspond to
 * anything the real permission system understands. This build already has
 * a real, working 7-role permission matrix (accountTypes.ts's
 * OrgAdminRoleV3 / orgRoleCan(), §42.1/§42.2) used throughout
 * RecruiterWorkflow, VerificationReview, EnterpriseIntegrations, etc. —
 * inviting staff into a role name that permission-checking code doesn't
 * recognise would be worse fidelity to the product's actual behavior than
 * using the real role vocabulary, so the invite form offers the real
 * roles instead of the mockup's four illustrative labels.
 */
export type OrgStaffStatus = 'invited' | 'active'

export interface OrgStaffRecord {
  id: string
  orgEmail: string
  staffEmail: string
  role: OrgAdminRoleV3
  status: OrgStaffStatus
  invitedAt: string
}

const STORAGE_KEY = 'profile:demo-org-staff'
/** §42.3 Rule 3 — the existing 20-role cap this build's Patch Set 4 work
 * already established as the real constraint for this roster. */
export const MAX_STAFF = 20

function readAll(): OrgStaffRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: OrgStaffRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listStaffFor(orgEmail: string): OrgStaffRecord[] {
  const e = orgEmail.toLowerCase()
  return readAll()
    .filter((r) => r.orgEmail.toLowerCase() === e)
    .sort((a, b) => b.invitedAt.localeCompare(a.invitedAt))
}

/** Bulk-invites a comma-separated list of emails into one role at once —
 * skips any email already on the roster rather than duplicating it, and
 * stops at MAX_STAFF total. */
export function inviteStaffBulk(orgEmail: string, _orgName: string, emailsInput: string, role: OrgAdminRoleV3): OrgStaffRecord[] {
  const all = readAll()
  const existing = listStaffFor(orgEmail)
  const existingEmails = new Set(existing.map((r) => r.staffEmail.toLowerCase()))
  const room = Math.max(0, MAX_STAFF - existing.length)

  const emails = emailsInput
    .split(',')
    .map((e) => e.trim())
    .filter(Boolean)
    .filter((e) => !existingEmails.has(e.toLowerCase()))
    .slice(0, room)

  const created: OrgStaffRecord[] = emails.map((staffEmail) => ({
    id: crypto.randomUUID(),
    orgEmail,
    staffEmail,
    role,
    status: 'invited',
    invitedAt: new Date().toISOString(),
  }))

  writeAll([...all, ...created])
  for (const record of created) {
    void emitEvent('staff_invite', record.staffEmail, { deepLink: '/notifications', vars: { role: role.replace(/_/g, ' ') } })
  }
  return created
}

export function revokeStaff(id: string): void {
  const all = readAll()
  writeAll(all.filter((r) => r.id !== id))
}

export const ACCESS_LABEL: Record<OrgAdminRoleV3, string> = {
  super_admin: 'Full access',
  admin: 'Full access (non-billing)',
  verification_officer: 'Verification only',
  hr_manager: 'Hiring only',
  credential_manager: 'Credential issuance only',
  moderator: 'Content moderation only',
  compliance_officer: 'Audit & compliance only',
}
