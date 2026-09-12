import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'

/** §50.9.7 PROFILE_ACADEMY_TOPICS, verbatim. */
const ACADEMY_TOPICS = [
  'Building a professional profile',
  'Creating an effective portfolio',
  'CV and cover letter guidance',
  'Interview preparation',
  'Career planning',
  'Business profile optimisation',
  'Research presentation',
  'Trade and artisan branding',
  'Personal branding',
  'Networking best practices',
]

const TABS = ['recommended', 'in-progress', 'completed'] as const

/** §21.1 Profile Learn — Learn → Practice → Verify → Earn → Teach. */
export function LearningPage() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('recommended')

  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-text-0">Learning</h1>
        <p className="mb-6 text-sm text-text-1">Completed certificates auto-add to your CV and contribute +8 to your Trust Score.</p>

        <div className="mb-6 flex gap-2 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold capitalize ${tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>

        {tab === 'recommended' && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {ACADEMY_TOPICS.map((topic) => (
              <div key={topic} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-1 font-semibold text-text-0">{topic}</div>
                <div className="text-xs text-text-1">PROFILE Academy · self-paced course</div>
              </div>
            ))}
          </div>
        )}

        {tab === 'in-progress' && (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            Nothing in progress yet — start a course from Recommended.
          </div>
        )}

        {tab === 'completed' && (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No completed courses yet. Completed certificates appear here and on your CV.
          </div>
        )}
      </div>
    </AppShell>
  )
}
