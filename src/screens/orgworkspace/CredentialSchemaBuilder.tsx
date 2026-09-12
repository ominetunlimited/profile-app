import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools, orgRoleCan } from '@/app/accountTypes'
import { OrgWorkspaceShell, HubAccessDenied } from './OrgWorkspaceShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { createSchema, listSchemas, publishSchema, type SchemaFieldRecord, type VerificationType } from '@/app/schemaStore'

const VERIFICATION_TYPES: VerificationType[] = ['academic_affiliation', 'academic', 'employment', 'professional_licence', 'certification', 'custom']

/** §16.2 Institutional Schema Builder — institutions define their own
 * verification requirements, no fixed PROFILE template. */
export function CredentialSchemaBuilder() {
  const { account } = useAccount()

  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }

  const canEdit = orgRoleCan(account, 'editOrgProfile')
  const [schemas, setSchemas] = useState(() => listSchemas(account.officialEmail))
  const [name, setName] = useState('')
  const [verificationType, setVerificationType] = useState<VerificationType>('academic_affiliation')
  const [fields, setFields] = useState<SchemaFieldRecord[]>([{ name: 'fullLegalName', label: 'Full legal name', type: 'text', required: true }])

  function addField() {
    setFields((f) => [...f, { name: '', label: '', type: 'text', required: false }])
  }
  function updateField(i: number, patch: Partial<SchemaFieldRecord>) {
    setFields((f) => f.map((field, idx) => (idx === i ? { ...field, ...patch } : field)))
  }
  function removeField(i: number) {
    setFields((f) => f.filter((_, idx) => idx !== i))
  }

  return (
    <OrgWorkspaceShell title="Credential Schema Builder">
      {!canEdit && (
        <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
          Your role ({account.orgRole}) can't edit schemas (§42.2) — view only.
        </div>
      )}

      <div className="mb-8 rounded-xl border border-border bg-surface p-5">
        <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Schema name">
            <TextInput disabled={!canEdit} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. University Degree Verification" />
          </Field>
          <Field label="Verification type" hint="A schema confirms exactly one precise claim — never silently upgraded (§4.4).">
            <SelectInput disabled={!canEdit} value={verificationType} onChange={(e) => setVerificationType(e.target.value as VerificationType)}>
              {VERIFICATION_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectInput>
          </Field>
        </div>

        <div className="mb-3 text-xs font-semibold uppercase tracking-wide text-text-2">Fields</div>
        <div className="mb-3 flex flex-col gap-2">
          {fields.map((field, i) => (
            <div key={i} className="flex flex-wrap items-center gap-2 rounded-lg border border-border p-2.5">
              <input
                disabled={!canEdit}
                value={field.label}
                onChange={(e) => updateField(i, { label: e.target.value, name: e.target.value.replace(/\s+/g, '') })}
                placeholder="Field label"
                className="min-h-[36px] flex-1 rounded border border-border-strong bg-surface px-2 text-sm"
              />
              <select
                disabled={!canEdit}
                value={field.type}
                onChange={(e) => updateField(i, { type: e.target.value as SchemaFieldRecord['type'] })}
                className="min-h-[36px] rounded border border-border-strong bg-surface px-2 text-sm"
              >
                {['text', 'number', 'date', 'select', 'document'].map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
              <label className="flex items-center gap-1 text-xs text-text-1">
                <input disabled={!canEdit} type="checkbox" checked={field.required} onChange={(e) => updateField(i, { required: e.target.checked })} /> required
              </label>
              {canEdit && (
                <button onClick={() => removeField(i)} className="text-xs text-danger">
                  Remove
                </button>
              )}
            </div>
          ))}
        </div>
        {canEdit && (
          <div className="flex gap-2">
            <Button variant="secondary" onClick={addField}>
              + Add field
            </Button>
            <Button
              disabled={!name.trim() || fields.length === 0}
              onClick={() => {
                createSchema(account.officialEmail, name, verificationType, fields)
                setSchemas(listSchemas(account.officialEmail))
                setName('')
                setFields([{ name: 'fullLegalName', label: 'Full legal name', type: 'text', required: true }])
              }}
            >
              Save as draft
            </Button>
          </div>
        )}
      </div>

      <div className="text-sm font-semibold text-text-0">Your schemas</div>
      {schemas.length === 0 ? (
        <p className="mt-2 text-sm text-text-1">No schemas created yet.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-2">
          {schemas.map((s) => (
            <div key={s.id} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
              <div>
                <div className="text-sm font-medium text-text-0">
                  {s.name} <span className="font-mono text-xs text-text-2">v{s.version}</span>
                </div>
                <div className="text-xs text-text-1">
                  {s.verificationType} · {s.fields.length} field{s.fields.length === 1 ? '' : 's'}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${s.status === 'published' ? 'border border-success text-success' : 'border border-warning text-warning'}`}>
                  {s.status}
                </span>
                {canEdit && s.status === 'draft' && (
                  <button
                    onClick={() => {
                      publishSchema(s.id)
                      setSchemas(listSchemas(account.officialEmail))
                    }}
                    className="rounded-lg border border-border-strong px-2.5 py-1 text-xs font-semibold text-text-0"
                  >
                    Publish
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </OrgWorkspaceShell>
  )
}
