import { useState } from 'react'
import { useAccount } from '@/app/AccountContext'
import { canAccessInstitutionHubTools, canAccessUniversityTools, orgRoleCan } from '@/app/accountTypes'
import { OrgSubPageShell, HubAccessDenied, SectorAccessDenied } from './OrgWorkspaceShell'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import {
  addEvidenceRequirement,
  confirmedRecordCountForSchema,
  createSchema,
  listSchemas,
  publishSchema,
  removeEvidenceRequirement,
  updateSchemaFields,
  type SchemaFieldRecord,
  type VerificationType,
} from '@/app/schemaStore'

const VERIFICATION_TYPES: VerificationType[] = ['academic_affiliation', 'academic', 'employment', 'professional_licence', 'certification', 'custom']
const FIELD_TYPES: SchemaFieldRecord['type'][] = ['text', 'number', 'date', 'select', 'document']

/** §16.2 Institutional Schema Builder — design handoff gap audit rebuild.
 * Read PROFILE Credential Schema Builder.dc.html directly: a two-column
 * layout (schema list + selected-schema detail panel), a real "Used by N
 * confirmed records" count, an evidence-required tag list, and in-place
 * "Add field"/"Publish changes" editing of an already-created schema —
 * none of which the earlier flat create-then-list view had.
 *
 * Flagged substitution: "Used by N confirmed records" is honestly always 0
 * (confirmedRecordCountForSchema) — no submitted VerificationRequest
 * references a specific institution schema id anywhere in this build, so
 * there's no real join to count from. Never fabricated to match the
 * mockup's illustrative 4820/612/88/3.
 */
export function CredentialSchemaBuilder() {
  const { account } = useAccount()

  if (!account || !canAccessInstitutionHubTools(account)) {
    return <HubAccessDenied requiredHub="institutional_hub" />
  }
  // §34.2a — real for University/Polytechnic/College/School, not every
  // institutional_hub org type (e.g. a Research Institute or Certification
  // Authority shares the hub but not this specific tool).
  if (!canAccessUniversityTools(account)) {
    return <SectorAccessDenied toolName="Credential Schema Builder" scopeDescription="universities, polytechnics, colleges, and schools" />
  }

  const canEdit = orgRoleCan(account, 'editOrgProfile')
  const officialEmail = account.officialEmail
  const [schemas, setSchemas] = useState(() => listSchemas(officialEmail))
  const [activeId, setActiveId] = useState<string | null>(() => listSchemas(officialEmail)[0]?.id ?? null)
  const [creating, setCreating] = useState(schemas.length === 0)
  const [evidenceDraft, setEvidenceDraft] = useState('')

  const [name, setName] = useState('')
  const [verificationType, setVerificationType] = useState<VerificationType>('academic_affiliation')
  const [fields, setFields] = useState<SchemaFieldRecord[]>([{ name: 'fullLegalName', label: 'Full legal name', type: 'text', required: true }])

  const active = schemas.find((s) => s.id === activeId) ?? null

  function refresh() {
    setSchemas(listSchemas(officialEmail))
  }

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
    <OrgSubPageShell title="Credential schema builder" crumb={`${account.legalName} · Institution workspace`}>
      <p className="mb-5 max-w-[70ch] text-sm leading-relaxed text-text-1">
        Define the record types your institution can confirm — the fields required, and what evidence a submitter
        must attach before it enters your review queue.
      </p>
      {!canEdit && (
        <div className="mb-5 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
          Your role ({account.orgRole}) can't edit schemas — view only.
        </div>
      )}

      <div className="flex flex-wrap gap-5">
        <div className="flex w-full flex-none flex-col gap-2 sm:w-auto sm:basis-[230px]">
          {schemas.map((s) => (
            <button
              key={s.id}
              onClick={() => {
                setActiveId(s.id)
                setCreating(false)
              }}
              className={`rounded-lg border-[1.5px] px-3 py-2.5 text-left ${!creating && activeId === s.id ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
            >
              <div className="text-[12.5px] font-semibold text-text-0">{s.name}</div>
              <div className="text-[11px] text-text-1">{s.fields.length} fields</div>
            </button>
          ))}
          {canEdit && (
            <button
              onClick={() => setCreating(true)}
              className={`rounded-lg border-[1.5px] border-dashed px-3 py-2.5 text-left text-[12.5px] font-semibold text-accent ${creating ? 'border-accent bg-accent-soft' : 'border-border-strong'}`}
            >
              + New schema
            </button>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-[300px] rounded-2xl border border-border bg-surface p-5 shadow-sm">
          {creating ? (
            <div>
              <div className="mb-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <Field label="Schema name">
                  <TextInput disabled={!canEdit} value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. University Degree Verification" />
                </Field>
                <Field label="Verification type" hint="A schema confirms exactly one precise claim — never silently upgraded.">
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
                      {FIELD_TYPES.map((t) => (
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
                      const created = createSchema(account.officialEmail, name, verificationType, fields)
                      refresh()
                      setActiveId(created.id)
                      setCreating(false)
                      setName('')
                      setFields([{ name: 'fullLegalName', label: 'Full legal name', type: 'text', required: true }])
                    }}
                  >
                    Save as draft
                  </Button>
                </div>
              )}
            </div>
          ) : active ? (
            <div>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <h2 className="text-lg font-bold text-text-0">{active.name}</h2>
                <span className="text-[11.5px] text-text-1">Used by {confirmedRecordCountForSchema(active.id)} confirmed records</span>
              </div>

              <div className="mb-5 flex flex-col gap-2.5">
                {active.fields.map((f, i) => {
                  function patchActiveField(patch: Partial<SchemaFieldRecord>) {
                    updateSchemaFields(
                      active!.id,
                      active!.fields.map((field, idx) => (idx === i ? { ...field, ...patch } : field)),
                    )
                    refresh()
                  }
                  if (!canEdit) {
                    return (
                      <div key={i} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border p-2.5">
                        <span className="min-w-[140px] flex-1 text-[12.5px] font-semibold text-text-0">{f.label || '(unlabelled field)'}</span>
                        <span className="rounded-full bg-surface-sunken px-2.5 py-0.5 font-mono text-[11px] text-text-1">{f.type}</span>
                        {f.required && <span className="text-[10.5px] font-semibold text-trust">Required</span>}
                      </div>
                    )
                  }
                  return (
                    <div key={i} className="flex flex-wrap items-center gap-2.5 rounded-lg border border-border p-2.5">
                      <input
                        value={f.label}
                        onChange={(e) => patchActiveField({ label: e.target.value, name: e.target.value.replace(/\s+/g, '') })}
                        placeholder="Field label"
                        className="min-h-[36px] min-w-[140px] flex-1 rounded border border-border-strong bg-surface px-2 text-[12.5px] font-semibold text-text-0"
                      />
                      <select
                        value={f.type}
                        onChange={(e) => patchActiveField({ type: e.target.value as SchemaFieldRecord['type'] })}
                        className="min-h-[36px] rounded-full bg-surface-sunken px-2.5 font-mono text-[11px] text-text-1"
                      >
                        {FIELD_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                      <label className="flex items-center gap-1 text-[10.5px] font-semibold text-trust">
                        <input type="checkbox" checked={f.required} onChange={(e) => patchActiveField({ required: e.target.checked })} /> Required
                      </label>
                      <button
                        onClick={() => {
                          updateSchemaFields(
                            active.id,
                            active.fields.filter((_, idx) => idx !== i),
                          )
                          refresh()
                        }}
                        className="text-xs text-danger"
                      >
                        Remove
                      </button>
                    </div>
                  )
                })}
                {canEdit && (
                  <button
                    onClick={() => {
                      updateSchemaFields(active.id, [...active.fields, { name: '', label: '', type: 'text', required: false }])
                      refresh()
                    }}
                    className="self-start rounded-lg border border-border-strong bg-surface-sunken px-3.5 py-2 text-xs font-semibold text-text-0"
                  >
                    + Add field
                  </button>
                )}
              </div>

              <div className="border-t border-border pt-4">
                <div className="mb-2.5 text-[12.5px] font-semibold text-text-0">Evidence required before review</div>
                <div className="mb-2.5 flex flex-wrap gap-1.5">
                  {active.evidenceRequired.length === 0 && <span className="text-xs text-text-1">No evidence requirements set.</span>}
                  {active.evidenceRequired.map((e) => (
                    <span key={e} className="flex items-center gap-1.5 rounded-full border border-trust bg-trust-soft px-2.5 py-1 text-[11.5px] font-semibold text-trust">
                      {e}
                      {canEdit && (
                        <button
                          onClick={() => {
                            removeEvidenceRequirement(active.id, e)
                            refresh()
                          }}
                          aria-label={`Remove ${e}`}
                          className="text-trust"
                        >
                          ×
                        </button>
                      )}
                    </span>
                  ))}
                </div>
                {canEdit && (
                  <div className="flex gap-2">
                    <input
                      value={evidenceDraft}
                      onChange={(e) => setEvidenceDraft(e.target.value)}
                      placeholder="e.g. Transcript"
                      className="h-9 min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-2.5 text-sm"
                    />
                    <button
                      disabled={!evidenceDraft.trim()}
                      onClick={() => {
                        addEvidenceRequirement(active.id, evidenceDraft.trim())
                        setEvidenceDraft('')
                        refresh()
                      }}
                      className="h-9 rounded-lg border border-border-strong bg-surface-sunken px-3 text-xs font-semibold text-text-0 disabled:opacity-50"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>

              {canEdit && (
                <div className="mt-5 flex flex-wrap items-center gap-2.5">
                  <span className={`rounded-full px-2.5 py-0.5 text-[10.5px] font-semibold ${active.status === 'published' ? 'border border-success text-success' : 'border border-warning text-warning'}`}>
                    {active.status}
                  </span>
                  {active.status === 'draft' && (
                    <button
                      onClick={() => {
                        publishSchema(active.id)
                        refresh()
                      }}
                      className="h-[38px] rounded-lg bg-accent-solid px-4 text-[12.5px] font-semibold text-white"
                    >
                      Publish changes
                    </button>
                  )}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-text-1">No schemas created yet.</p>
          )}
        </div>
      </div>
    </OrgSubPageShell>
  )
}
