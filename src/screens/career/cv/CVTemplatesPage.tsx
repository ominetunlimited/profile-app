import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { buildCvData } from '@/app/careerData'
import { CV_TEMPLATES } from './cvTemplates'
import { CvDetailsEditor } from './CvDetailsEditor'

/** §47.5 CV Template Library — real data-bound preview, never the Handoff's
 * illustrative persona. */
export function CVTemplatesPage() {
  const { template } = useParams<{ template: string }>()
  const navigate = useNavigate()
  const { account } = useAccount()
  const [cv, setCv] = useState(() => buildCvData(account))
  const [editorOpen, setEditorOpen] = useState(false)

  const initialIndex = Math.max(0, CV_TEMPLATES.findIndex((t) => t.id === template))
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex)
  const active = CV_TEMPLATES[index]

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 py-8 sm:px-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-2">Career Engine · CV templates</div>
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-text-0">10 CV templates</h1>

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <select
            value={index}
            onChange={(e) => {
              const i = Number(e.target.value)
              setIndex(i)
              navigate(`/career/cv/${CV_TEMPLATES[i].id}`, { replace: true })
            }}
            className="min-h-[40px] rounded-lg border border-border-strong bg-surface px-3 text-sm font-medium text-text-0"
          >
            {CV_TEMPLATES.map((t, i) => (
              <option key={t.id} value={i}>
                {i + 1}. {t.label}
              </option>
            ))}
          </select>
          <span className="text-xs text-text-1">{active.description}</span>
          <Button variant="secondary" className="ms-auto" onClick={() => setEditorOpen((v) => !v)}>
            {editorOpen ? 'Hide' : 'Edit'} CV details
          </Button>
        </div>

        {editorOpen && (
          <div className="mb-8 rounded-xl border border-border bg-surface p-5">
            <CvDetailsEditor
              ownerEmail={ownerKey(account)}
              onSaved={() => {
                setCv(buildCvData(account))
                setEditorOpen(false)
              }}
            />
          </div>
        )}

        {!cv.hasContent && (
          <div className="mb-6 rounded-lg border border-warning bg-surface-sunken p-3 text-sm text-text-1">
            This preview is bound to your real profile — it's mostly empty because nothing's been recorded yet.
            Head to Home to record your first activity, or use "Edit CV details" above for education, certifications,
            languages, and references.
          </div>
        )}

        <div className="mb-8 rounded-xl bg-surface-sunken p-6">
          <active.Component cv={cv} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <InfoCard title="What every template shares" body="Clear hierarchy, quantified achievement bullets, and every field editable in place once wired to a real profile." />
          <InfoCard title="ATS note" body="Executive, Minimalist, Creative and International templates are single-column and parse cleanly through applicant tracking systems." />
          <InfoCard title="Source of content" body="Experience and skills pull from your recorded activities; education, certifications, languages, and references are entered directly, since they aren't derivable from activity records." />
        </div>
      </div>
    </AppShell>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 font-semibold text-text-0">{title}</div>
      <p className="text-xs leading-relaxed text-text-1">{body}</p>
    </div>
  )
}
