import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'
import { listAllFeedback, setFeedbackStatus, useFeedbackVersion, type FeedbackStatus } from '@/app/feedbackStore'

const TONE: Record<FeedbackStatus, string> = { new: 'bg-warning-soft text-warning', seen: 'bg-accent-soft text-accent', resolved: 'bg-success-soft text-success' }

/** Everything people have sent through the Feedback Centre. Reviewers mark items seen or resolved; the database refuses the change for anyone without review access. */
export function AdminFeedback() {
  const { admin } = useAdmin()
  useFeedbackVersion()
  const allowed = !!admin && platformRoleCan(admin.role, 'data_requests')
  const items = allowed ? listAllFeedback() : []

  if (!allowed) return <p className="text-sm text-text-1">Your role doesn't include feedback review.</p>
  return (
    <div>
      <h1 className="mb-1 text-xl font-bold tracking-tight text-text-0">Feedback</h1>
      <p className="mb-4 text-sm text-text-1">
        {items.filter((i) => i.status === 'new').length} new · {items.length} total
      </p>
      {items.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">No feedback has been sent yet.</div>
      ) : (
        <div className="flex flex-col gap-2">
          {items.map((f) => (
            <div key={f.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center gap-2 text-[11px] text-text-1">
                <span className="rounded-full border border-border px-2 py-0.5 uppercase text-text-2">{f.category}</span>
                <span className={`rounded-full px-2 py-0.5 font-semibold ${TONE[f.status]}`}>{f.status}</span>
                <span>{f.ownerEmail}</span>
                <span>{new Date(f.createdAt).toLocaleString()}</span>
              </div>
              <p className="whitespace-pre-wrap text-text-0">{f.message}</p>
              <div className="mt-2 flex gap-2">
                {f.status === 'new' && (
                  <button onClick={() => void setFeedbackStatus(f.id, 'seen').catch(() => undefined)} className="rounded-lg border border-border-strong px-2.5 py-1 text-[11px] font-semibold text-text-0">
                    Mark seen
                  </button>
                )}
                {f.status !== 'resolved' && (
                  <button onClick={() => void setFeedbackStatus(f.id, 'resolved').catch(() => undefined)} className="rounded-lg border border-border-strong px-2.5 py-1 text-[11px] font-semibold text-text-0">
                    Mark resolved
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
