import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'
import { listRequestsForIssuerEmail } from './verificationRequestStore'

/** The record types an institution can confirm, stored on the server (public.verification_schemas). Published schemas are visible to everyone; drafts only to the institution's own administrators and credential managers. */
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


interface Row {
  id: string
  institution_email: string
  name: string
  version: string
  verification_type: VerificationType
  fields: SchemaFieldRecord[]
  evidence_required: string[]
  status: 'draft' | 'published' | 'retired'
  created_at: string
}

const table = createServerTable<Row>('verification_schemas', { orderBy: 'created_at', ascending: true })
export const useSchemasVersion = table.useVersion
const toRecord = (r: Row): VerificationSchemaRecord => ({ id: r.id, institutionEmail: r.institution_email, name: r.name, version: r.version, verificationType: r.verification_type, fields: r.fields, evidenceRequired: r.evidence_required, status: r.status, createdAt: r.created_at })

export function listSchemas(institutionEmail: string): VerificationSchemaRecord[] {
  return table.rows().filter((s) => s.institution_email.toLowerCase() === institutionEmail.toLowerCase()).map(toRecord)
}

function patch(id: string, change: Partial<Row>) {
  table.set(table.rows().map((r) => (r.id === id ? { ...r, ...change } : r)))
  void persist(table, () => supabase.from('verification_schemas').update(change).eq('id', id)).catch(() => undefined)
}

export function createSchema(institutionEmail: string, name: string, verificationType: VerificationType, fields: SchemaFieldRecord[], evidenceRequired: string[] = []): VerificationSchemaRecord {
  const row: Row = { id: crypto.randomUUID(), institution_email: institutionEmail.toLowerCase(), name, version: '1.0', verification_type: verificationType, fields, evidence_required: evidenceRequired, status: 'draft', created_at: new Date().toISOString() }
  table.set([...table.rows(), row])
  void persist(table, () => supabase.from('verification_schemas').insert(row)).catch(() => undefined)
  return toRecord(row)
}

export const publishSchema = (id: string) => patch(id, { status: 'published' })
export const updateSchemaFields = (id: string, fields: SchemaFieldRecord[]) => patch(id, { fields })

export function addEvidenceRequirement(id: string, evidence: string) {
  const r = table.rows().find((x) => x.id === id)
  if (!r || r.evidence_required.includes(evidence)) return
  patch(id, { evidence_required: [...r.evidence_required, evidence] })
}

export function removeEvidenceRequirement(id: string, evidence: string) {
  const r = table.rows().find((x) => x.id === id)
  if (!r) return
  patch(id, { evidence_required: r.evidence_required.filter((e) => e !== evidence) })
}

const MODULE_FOR_TYPE: Record<VerificationType, string> = {
  academic_affiliation: 'academic',
  academic: 'academic',
  employment: 'employment',
  professional_licence: 'professional_licence',
  certification: 'certification',
  custom: 'custom',
}

/** Records this institution has actually confirmed of the schema's kind. */
export function confirmedRecordCountForSchema(schemaId: string): number {
  const s = table.rows().find((x) => x.id === schemaId)
  if (!s) return 0
  return listRequestsForIssuerEmail(s.institution_email).filter((r) => r.status === 'verified' && r.moduleKey === MODULE_FOR_TYPE[s.verification_type]).length
}
