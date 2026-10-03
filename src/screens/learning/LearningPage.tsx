import { useMemo, useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { ACADEMY_TOPICS, completeCourse, listEnrollments, startCourse } from '@/app/learningStore'
import { getCvDetails, saveCvDetails } from '@/app/cvDetailsStore'
import { recommend } from '@/app/recommendationEngine'

/** Learning: topics worth working on, what you've started, and what you've finished. */
export function LearningPage() {
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  const [enrollments, setEnrollments] = useState(() => listEnrollments(owner))

  function refresh() {
    setEnrollments(listEnrollments(owner))
  }

  function handleComplete(topic: string) {
    completeCourse(owner, topic)
    // A finished topic becomes a CV certification entry, marked as self-reported.
    const details = getCvDetails(owner)
    if (!details.certifications.some((c) => c.name === topic)) {
      saveCvDetails(owner, {
        ...details,
        certifications: [...details.certifications, { id: `course-${Date.now()}`, name: topic, issuer: 'Self-reported', year: new Date().getFullYear().toString() }],
      })
    }
    refresh()
  }

  // The engine's own reason for suggesting a topic, where it has one.
  const reasons = useMemo(() => {
    const m = new Map<string, string>()
    for (const r of recommend(account, 30)) if (r.kind === 'learning') m.set(r.title, r.reason)
    return m
  }, [account])

  const inProgress = enrollments.filter((e) => e.status === 'in_progress')
  const completed = enrollments.filter((e) => e.status === 'completed')
  const recommended = ACADEMY_TOPICS.filter((t) => !enrollments.some((e) => e.topic === t))

  return (
    <AppShell>
      <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-6 sm:px-7">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-[.12em] text-text-2">Career Growth</div>
        <h1 className="mb-1.5 text-[26px] font-bold leading-tight tracking-tight text-text-0">Learning</h1>
        <p className="mb-1.5 max-w-[70ch] text-[13px] leading-relaxed text-text-1">
          Topics suggested from your career direction and recorded work. Finishing one adds it to your CV, so it doesn't just sit as a badge.
        </p>
        <p className="mb-[22px] max-w-[70ch] text-xs leading-relaxed text-text-2">
          Courses aren't hosted on PROFILE yet — use this to track what you're learning. A finished topic appears on your CV as self-reported, not verified, and doesn't add Trust Score points.
        </p>

        <section className="mb-[26px]" aria-labelledby="recommended">
          <h2 id="recommended" className="mb-3 text-[13px] font-semibold text-text-0">Recommended for you</h2>
          {recommended.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">You've started every topic. Nice.</p>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,260px),1fr))] gap-3.5">
              {recommended.map((topic) => (
                <div key={topic} className="overflow-hidden rounded-[13px] border border-trust bg-surface shadow-sm">
                  <div className="flex h-[100px] items-center justify-center bg-[repeating-linear-gradient(45deg,var(--surface-sunken)_0_8px,var(--accent-soft)_8px_16px)] font-mono text-[10.5px] text-text-2" aria-hidden>
                    {'// course thumbnail'}
                  </div>
                  <div className="px-[15px] py-3.5">
                    <div className="mb-[5px] text-[13px] font-semibold text-text-0">{topic}</div>
                    <div className="mb-2 text-[11.5px] leading-normal text-text-1">{reasons.get(topic) ?? 'A topic from the PROFILE Academy list.'}</div>
                    <div className="mb-3 text-[11px] text-text-2">PROFILE Academy · self-paced</div>
                    <button
                      type="button"
                      onClick={() => {
                        startCourse(owner, topic)
                        refresh()
                      }}
                      className="h-8 rounded-lg border border-border-strong bg-surface px-3 text-xs font-semibold text-text-0 hover:border-accent"
                    >
                      Start learning
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-[26px]" aria-labelledby="in-progress">
          <h2 id="in-progress" className="mb-3 text-[13px] font-semibold text-text-0">In progress</h2>
          {inProgress.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing in progress yet — start a topic above.</p>
          ) : (
            inProgress.map((e) => (
              <div key={e.topic} className="mb-2.5 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-surface px-[17px] py-[15px]">
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-text-0">{e.topic}</span>
                  <span className="block text-[11.5px] text-text-1">PROFILE Academy · started {new Date(e.startedAt).toLocaleDateString()}</span>
                </span>
                <button type="button" onClick={() => handleComplete(e.topic)} className="h-8 rounded-lg bg-accent-solid px-3 text-xs font-semibold text-white">
                  Mark complete
                </button>
              </div>
            ))
          )}
        </section>

        <section aria-labelledby="completed">
          <h2 id="completed" className="mb-3 text-[13px] font-semibold text-text-0">Completed — added to your CV</h2>
          {completed.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">No completed topics yet. Finished ones appear here and on your CV.</p>
          ) : (
            <div className="flex flex-col gap-[9px]">
              {completed.map((e) => (
                <div key={e.topic} className="flex flex-wrap items-center justify-between gap-2 rounded-[11px] border border-border bg-surface px-[15px] py-3">
                  <span>
                    <span className="block text-[12.5px] font-semibold text-text-0">{e.topic}</span>
                    <span className="block text-[11px] text-text-1">Completed {e.completedAt ? new Date(e.completedAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''} · PROFILE Academy</span>
                  </span>
                  <span className="flex items-center gap-[5px] rounded-full border border-success bg-success-soft px-2.5 py-[3px] text-[11px] font-semibold text-success">✓ On your CV</span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </AppShell>
  )
}
