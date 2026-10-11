import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { ownerKey, useActivitiesCacheVersion } from '@/app/activityStore'
import { useAccountsCacheVersion } from '@/app/demoAccountStore'
import { useConnectionsCacheVersion } from '@/app/connectionStore'
import { useFollowsCacheVersion } from '@/app/followStore'
import { useJobsCacheVersion } from '@/app/jobStore'
import { useApplicationsCacheVersion } from '@/app/applicationStore'
import { useCommunitiesVersion } from '@/app/communityStore'
import { useSocialCacheVersion } from '@/app/socialStore'
import { KIND_LABEL, recommend, type Recommendation } from '@/app/recommendationEngine'
import { useLearningVersion } from '@/app/learningStore'
import { useCvDetailsVersion } from '@/app/cvDetailsStore'
import { recordFeedback, useRecommendationFeedbackVersion } from '@/app/recommendationFeedbackStore'
import { IconClose } from './icons'

/** "Recommended for you" — ranked, explained suggestions for this account type.
 * Recomputes live as the underlying data changes; every card says why it's
 * there, and dismissing/acting on one teaches the ranker. */
export function RecommendationsPanel({ limit = 5, title = 'Recommended for you', className = '' }: { limit?: number; title?: string; className?: string }) {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const versions =
    useActivitiesCacheVersion() + useAccountsCacheVersion() + useConnectionsCacheVersion() + useFollowsCacheVersion() + useJobsCacheVersion() +
    useApplicationsCacheVersion() + useCommunitiesVersion() + useSocialCacheVersion() + useRecommendationFeedbackVersion() + useLearningVersion() + useCvDetailsVersion()
  const recs = useMemo(() => recommend(account, limit), [account, limit, versions]) // eslint-disable-line react-hooks/exhaustive-deps
  const [open, setOpen] = useState<string | null>(null)

  if (!account) return null

  return (
    <section className={`rounded-xl border border-border bg-surface p-4 ${className}`} aria-label={title}>
      <h2 className="mb-0.5 text-sm font-semibold text-text-0">{title}</h2>
      <p className="mb-3 text-[11px] leading-relaxed text-text-2">Based on your account type, profile, skills and activity — each one says why.</p>
      {recs.length === 0 ? (
        <p className="rounded-lg bg-surface-sunken p-3 text-xs text-text-1">You're all caught up. New suggestions appear as your profile and the platform change.</p>
      ) : (
        <ul className="flex flex-col gap-2.5">
          {recs.map((r) => (
            <Card key={r.key} rec={r} owner={owner} expanded={open === r.key} onToggle={() => setOpen(open === r.key ? null : r.key)} />
          ))}
        </ul>
      )}
    </section>
  )
}

function Card({ rec, owner, expanded, onToggle }: { rec: Recommendation; owner: string; expanded: boolean; onToggle: () => void }) {
  return (
    <li className="rounded-lg border border-border bg-surface-sunken p-3">
      <div className="mb-1 flex items-center gap-2">
        <span className="rounded-full bg-accent-soft px-1.5 py-0.5 text-[9.5px] font-semibold uppercase tracking-wide text-accent">{KIND_LABEL[rec.kind]}</span>
        <div className="flex-1" />
        <button onClick={() => void recordFeedback(owner, rec.key, rec.kind, 'dismissed')} aria-label={`Not interested: ${rec.title}`} title="Not interested" className="flex items-center text-text-2 hover:text-text-0">
          <IconClose size={14} />
        </button>
      </div>
      <div className="text-sm font-semibold text-text-0">{rec.title}</div>
      <p className="mt-0.5 text-xs leading-relaxed text-text-1">{rec.reason}</p>
      <div className="mt-2 flex items-center gap-3">
        <Link to={rec.to} onClick={() => void recordFeedback(owner, rec.key, rec.kind, 'acted')} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
          {rec.cta}
        </Link>
        <button onClick={onToggle} aria-expanded={expanded} className="text-[11px] font-medium text-text-2 hover:text-text-0">
          {expanded ? 'Hide why' : 'Why am I seeing this?'}
        </button>
      </div>
      {expanded && (
        <ul className="mt-2 list-disc ps-4 text-[11px] text-text-2">
          {rec.signals.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ul>
      )}
    </li>
  )
}
