import { useState } from 'react'
import { Link } from 'react-router-dom'
import { addAttribution, disputeAttribution, listAttributionsFor, removeAttribution, type AttributionRecord, type AttributionSubjectType, useAttributionsVersion } from '@/app/attributionStore'
import { findAccountByEmail } from '@/app/demoAccountStore'
import { IconTag } from './icons'

const SUBJECT_TYPES: { value: AttributionSubjectType; label: string }[] = [
  { value: 'person', label: 'Person' },
  { value: 'organisation', label: 'Organisation' },
  { value: 'provider', label: 'Provider' },
  { value: 'tool', label: 'Tool' },
  { value: 'project', label: 'Project partner' },
]

/**
 * §2.5 Attribution Display + §2.2 after-publish crediting. `isSelf` gets a
 * real add-credit control (no delete-and-repost required); everyone sees
 * the resulting credit line, collapsed behind "with N contributors" past
 * two names per §2.5's mobile guidance. A credited real account can
 * dispute or remove their own credit (§2.4) — never editable by anyone
 * else's say-so alone.
 */
export function AttributionSection({ activityId, activityOwnerEmail, isSelf, viewerEmail }: { activityId: string; activityOwnerEmail: string; isSelf: boolean; viewerEmail: string }) {
  useAttributionsVersion()
  const records = listAttributionsFor(activityId)
  const [formOpen, setFormOpen] = useState(false)
  const [expanded, setExpanded] = useState(false)
  const [subjectType, setSubjectType] = useState<AttributionSubjectType>('person')
  const [subjectName, setSubjectName] = useState('')
  const [role, setRole] = useState('')

  function refresh() {
  }

  function submit() {
    if (!subjectName.trim() || !role.trim()) return
    addAttribution({ activityId, activityOwnerEmail, subjectType, subjectName: subjectName.trim(), role: role.trim(), taggedBy: activityOwnerEmail })
    setSubjectName('')
    setRole('')
    setFormOpen(false)
    refresh()
  }

  const visible = expanded ? records : records.slice(0, 2)
  const hiddenCount = records.length - visible.length

  return (
    <div className="mb-2">
      {records.length > 0 && (
        <p className="text-xs text-text-2">
          With contributions from{' '}
          {visible.map((r, i) => (
            <span key={r.id}>
              <AttributionName record={r} />
              {r.status === 'disputed' && <span className="text-warning"> (disputed)</span>}
              {r.subjectEmail?.toLowerCase() === viewerEmail.toLowerCase() && r.status === 'active' && (
                <button onClick={() => { disputeAttribution(r.id, viewerEmail); refresh() }} className="ms-1 text-[10px] font-semibold text-danger">
                  Dispute
                </button>
              )}
              {(r.taggedBy.toLowerCase() === viewerEmail.toLowerCase() || r.subjectEmail?.toLowerCase() === viewerEmail.toLowerCase()) && (
                <button onClick={() => { removeAttribution(r.id, viewerEmail); refresh() }} className="ms-1 text-[10px] font-semibold text-text-2">
                  Remove
                </button>
              )}
              {i < visible.length - 1 ? ', ' : ''}
            </span>
          ))}
          {hiddenCount > 0 && (
            <button onClick={() => setExpanded(true)} className="ms-1 font-semibold text-accent">
              +{hiddenCount} more
            </button>
          )}
        </p>
      )}

      {isSelf && (
        <div className="mt-1">
          {formOpen ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <select value={subjectType} onChange={(e) => setSubjectType(e.target.value as AttributionSubjectType)} className="rounded-md border border-border-strong bg-surface px-1.5 py-1 text-xs">
                {SUBJECT_TYPES.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
              <input
                value={subjectName}
                onChange={(e) => setSubjectName(e.target.value)}
                placeholder="Name (or email to link a real account)"
                className="min-h-[28px] rounded-md border border-border-strong bg-surface px-2 text-xs"
              />
              <input value={role} onChange={(e) => setRole(e.target.value)} placeholder="Role (e.g. Designer)" className="min-h-[28px] w-32 rounded-md border border-border-strong bg-surface px-2 text-xs" />
              <button onClick={submit} className="text-xs font-semibold text-accent">
                Add credit
              </button>
              <button onClick={() => setFormOpen(false)} className="text-xs text-text-2">
                Cancel
              </button>
            </div>
          ) : (
            <button onClick={() => setFormOpen(true)} className="inline-flex items-center gap-1 text-xs font-semibold text-accent">
              <IconTag size={13} /> Tag / Credit
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function AttributionName({ record }: { record: AttributionRecord }) {
  const account = record.subjectEmail ? findAccountByEmail(record.subjectEmail) : undefined
  const username = account && 'username' in account ? account.username : undefined
  if (username) {
    return (
      <Link to={`/profile/${username}`} className="font-semibold text-text-1 hover:text-accent">
        {record.subjectName} <span className="font-normal">({record.role})</span>
      </Link>
    )
  }
  return (
    <span className="font-semibold text-text-1">
      {record.subjectName} <span className="font-normal">({record.role})</span>
    </span>
  )
}
