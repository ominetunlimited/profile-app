/** Temporary client-only scaffolding, same caveats as demoAccountStore.ts. */

/** §16.2 VerificationSchema / SchemaField, verbatim shape. */
export interface SchemaFieldRecord {
  name: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'document'
  required: boolean
}

export type VerificationType = 'academic_affiliation' | 'academic' | 'employment' | 'professional_licence' | 'certification' | 'custom'

export interface VerificationSchemaRecord {
  id: string
  institutionEmail: string
  name: string
  version: string
  verificationType: VerificationType
  fields: SchemaFieldRecord[]
  /** Design handoff gap audit — PROFILE Credential Schema Builder.dc.html's
   * "Evidence required before review" tag list, previously absent from this
   * store entirely. */
  evidenceRequired: string[]
  status: 'draft' | 'published' | 'retired'
  createdAt: string
}

const STORAGE_KEY = 'profile:demo-verification-schemas'

function readAll(): VerificationSchemaRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function writeAll(records: VerificationSchemaRecord[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listSchemas(institutionEmail: string): VerificationSchemaRecord[] {
  return readAll().filter((s) => s.institutionEmail === institutionEmail)
}

export function createSchema(
  institutionEmail: string,
  name: string,
  verificationType: VerificationType,
  fields: SchemaFieldRecord[],
  evidenceRequired: string[] = [],
): VerificationSchemaRecord {
  const record: VerificationSchemaRecord = {
    id: crypto.randomUUID(),
    institutionEmail,
    name,
    version: '1.0',
    verificationType,
    fields,
    evidenceRequired,
    status: 'draft',
    createdAt: new Date().toISOString(),
  }
  writeAll([...readAll(), record])
  return record
}

export function publishSchema(id: string) {
  const all = readAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], status: 'published' }
  writeAll(all)
}

/** Design handoff gap audit — the mockup's selected-schema detail panel
 * edits an already-created schema in place ("Add field" / "Publish
 * changes"), not just at creation time. */
export function updateSchemaFields(id: string, fields: SchemaFieldRecord[]) {
  const all = readAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], fields }
  writeAll(all)
}

export function addEvidenceRequirement(id: string, evidence: string) {
  const all = readAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return
  if (all[idx].evidenceRequired.includes(evidence)) return
  all[idx] = { ...all[idx], evidenceRequired: [...all[idx].evidenceRequired, evidence] }
  writeAll(all)
}

export function removeEvidenceRequirement(id: string, evidence: string) {
  const all = readAll()
  const idx = all.findIndex((s) => s.id === id)
  if (idx === -1) return
  all[idx] = { ...all[idx], evidenceRequired: all[idx].evidenceRequired.filter((e) => e !== evidence) }
  writeAll(all)
}

/** Honestly always 0 — no submitted VerificationRequest references a
 * specific institution schema id anywhere in this build yet (requests use
 * the fixed VERIFICATION_MODULES taxonomy, not custom schemas), so there is
 * no real join to count from. Never fabricated to look busy, unlike the
 * mockup's illustrative 4820/612/88/3. */
export function confirmedRecordCountForSchema(_schemaId: string): number {
  return 0
}
