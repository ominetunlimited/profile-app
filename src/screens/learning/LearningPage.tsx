import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { completeCourse, listEnrollments, startCourse } from '@/app/learningStore'
import { getCvDetails, saveCvDetails } from '@/app/cvDetailsStore'

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
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  const [tab, setTab] = useState<(typeof TABS)[number]>('recommended')
  const [enrollments, setEnrollments] = useState(() => listEnrollments(owner))

  function refresh() {
    setEnrollments(listEnrollments(owner))
  }

  function handleComplete(topic: string) {
    completeCourse(owner, topic)
    // §21.1 LEARN_FEATURES.certificateOnCompletion.autoAddsToCV — real:
    // a completed course becomes a real CertificationEntry in the same
    // store the CV's Certifications section already reads from.
    const details = getCvDetails(owner)
    if (!details.certifications.some((c) => c.name === topic)) {
      saveCvDetails(owner, {
        ...details,
        certifications: [...details.certifications, { id: `course-${Date.now()}`, name: topic, issuer: 'PROFILE Academy', year: new Date().getFullYear().toString() }],
      })
    }
    refresh()
  }

  const inProgress = enrollments.filter((e) => e.status === 'in_progress')
  const completed = enrollments.filter((e) => e.status === 'completed')

  return (
    <AppShell>
      <div className="mx-auto max-w-[820px] px-4 py-8 sm:px-6">
        <h1 className="mb-2 text-xl font-bold text-text-0">Learning</h1>
        <p className="mb-6 text-sm text-text-1">
          Completing a course really adds it to your CV's Certifications section. It does not add Trust Score points
          yet — §13.2's course_completed signal needs a real verification pipeline this build doesn't have, so that
          part stays honestly unclaimed rather than fabricated.
        </p>

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
            {ACADEMY_TOPICS.map((topic) => {
              const enrolled = enrollments.some((e) => e.topic === topic)
              return (
                <div key={topic} className="rounded-xl border border-border bg-surface p-4">
                  <div className="mb-1 font-semibold text-text-0">{topic}</div>
                  <div className="mb-3 text-xs text-text-1">PROFILE Academy · self-paced course</div>
                  {enrolled ? (
                    <span className="text-xs font-semibold text-text-2">Already enrolled</span>
                  ) : (
                    <Button
                      variant="secondary"
                      onClick={() => {
                        startCourse(owner, topic)
                        refresh()
                      }}
                    >
                      Start course
                    </Button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {tab === 'in-progress' &&
          (inProgress.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              Nothing in progress yet — start a course from Recommended.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {inProgress.map((e) => (
                <div key={e.topic} className="flex items-center justify-between rounded-lg border border-border bg-surface p-3">
                  <span className="text-sm text-text-0">{e.topic}</span>
                  <Button onClick={() => handleComplete(e.topic)}>Mark complete</Button>
                </div>
              ))}
            </div>
          ))}

        {tab === 'completed' &&
          (completed.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No completed courses yet. Completed certificates appear here and on your CV.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {completed.map((e) => (
                <div key={e.topic} className="rounded-lg border border-success bg-surface p-3 text-sm">
                  <span className="font-medium text-text-0">{e.topic}</span>
                  <span className="ms-2 text-xs text-text-2">Completed {e.completedAt ? new Date(e.completedAt).toLocaleDateString() : ''} · on your CV</span>
                </div>
              ))}
            </div>
          ))}
      </div>
    </AppShell>
  )
}
