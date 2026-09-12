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
): VerificationSchemaRecord {
  const record: VerificationSchemaRecord = {
    id: crypto.randomUUID(),
    institutionEmail,
    name,
    version: '1.0',
    verificationType,
    fields,
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
