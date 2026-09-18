/**
 * §42.2 Compliance/Audit trail — design handoff gap audit: Organization/
 * Institution/Government Workspace mockups all show a real "Compliance"
 * tab with an audit trail of real workspace actions. Real, local,
 * persisted log entries, appended from the actual real actions that
 * happen in this build (staff invited/revoked, verification requests
 * approved/rejected) rather than seeded to look busy.
 */
export interface OrgAuditEntry {
  id: string
  orgEmail: string
  text: string
  at: string
}

const STORAGE_KEY = 'profile:demo-org-audit-log'

function readAll(): OrgAuditEntry[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeAll(records: OrgAuditEntry[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function logOrgAction(orgEmail: string, text: string): void {
  const record: OrgAuditEntry = { id: crypto.randomUUID(), orgEmail, text, at: new Date().toISOString() }
  writeAll([...readAll(), record])
}

export function listAuditLogFor(orgEmail: string): OrgAuditEntry[] {
  const e = orgEmail.toLowerCase()
  return readAll()
    .filter((r) => r.orgEmail.toLowerCase() === e)
    .sort((a, b) => b.at.localeCompare(a.at))
}
