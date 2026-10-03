import type { ActivityRecord } from '@/app/activityStore'

/** Skills ordered by how many recorded activities support them — never self-rated. */
export function skillsByEvidence(activities: ActivityRecord[]): { name: string; count: number }[] {
  const counts = new Map<string, { name: string; count: number }>()
  for (const a of activities) {
    const seen = new Set<string>()
    for (const raw of a.skills) {
      const name = raw.trim()
      const key = name.toLowerCase()
      if (!name || seen.has(key)) continue
      seen.add(key)
      const cur = counts.get(key)
      if (cur) cur.count += 1
      else counts.set(key, { name, count: 1 })
    }
  }
  return [...counts.values()].sort((x, y) => y.count - x.count || x.name.localeCompare(y.name))
}

export function SkillsByEvidencePanel({ activities, isSelf }: { activities: ActivityRecord[]; isSelf: boolean }) {
  const skills = skillsByEvidence(activities)
  const max = skills[0]?.count ?? 1
  return (
    <section className="rounded-[13px] border border-border bg-surface p-4 shadow-sm" aria-labelledby="skills-by-evidence">
      <h2 id="skills-by-evidence" className="mb-1 text-[14.5px] font-semibold text-text-0">Skills, by evidence</h2>
      <p className="mb-3.5 text-xs text-text-1">Ordered by how many recorded activities support them — never self-rated.</p>
      {skills.length === 0 ? (
        <p className="text-[12.5px] text-text-1">
          {isSelf ? 'Tag skills on the work you record and they appear here, ranked by the evidence behind them.' : 'No skills have been tagged on recorded work yet.'}
        </p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {skills.slice(0, 12).map((s) => (
            <li key={s.name}>
              <div className="mb-1 flex items-baseline justify-between gap-2 text-[12.5px]">
                <span className="font-medium text-text-0">{s.name}</span>
                <span className="font-mono text-[11px] text-text-2">{s.count} record{s.count === 1 ? '' : 's'}</span>
              </div>
              <div className="h-[5px] overflow-hidden rounded-[3px] bg-surface-sunken">
                <div className="h-full rounded-[3px] bg-accent" style={{ width: `${Math.max(8, (s.count / max) * 100)}%` }} />
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** One timeline drawn from recorded activities, newest first. */
export function JourneyPanel({ activities, onOpen }: { activities: ActivityRecord[]; onOpen: (id: string) => void }) {
  if (activities.length === 0) return null
  return (
    <section className="rounded-[13px] border border-border bg-surface p-4 shadow-sm" aria-labelledby="journey">
      <h2 id="journey" className="mb-1 text-[14.5px] font-semibold text-text-0">Professional journey</h2>
      <p className="mb-4 text-xs text-text-1">One timeline, drawn from records rather than typed in. Each entry opens the record behind it.</p>
      <ol className="relative flex flex-col gap-4 border-s border-border-strong ps-5">
        {activities.slice(0, 8).map((a) => (
          <li key={a.id} className="relative">
            <span aria-hidden className="absolute -start-[25px] top-1 h-2.5 w-2.5 rounded-full border-2 border-accent bg-surface" />
            <div className="font-mono text-[10.5px] uppercase tracking-wide text-text-2">
              {new Date(a.createdAt).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })} · {a.type}
            </div>
            <button type="button" onClick={() => onOpen(a.id)} className="text-start text-[13px] font-semibold text-text-0 hover:text-accent">
              {a.title}
            </button>
            {(a.role || a.organisation) && <div className="text-xs text-text-1">{[a.role, a.organisation].filter(Boolean).join(' · ')}</div>}
          </li>
        ))}
      </ol>
    </section>
  )
}

export function CareerStagePanel({ stage, recordCount, skillCount }: { stage?: string; recordCount: number; skillCount: number }) {
  if (!stage) return null
  return (
    <section className="rounded-[13px] border border-border bg-surface p-4 shadow-sm" aria-labelledby="career-stage">
      <h2 id="career-stage" className="mb-1.5 text-[14.5px] font-semibold text-text-0">Career stage</h2>
      <p className="text-[13px] font-medium capitalize text-text-0">{stage.replace(/_/g, ' ')}</p>
      <p className="mt-1 text-xs leading-relaxed text-text-1">
        Set on the account, alongside {recordCount} recorded {recordCount === 1 ? 'activity' : 'activities'} and {skillCount} tagged {skillCount === 1 ? 'skill' : 'skills'}.
      </p>
    </section>
  )
}
