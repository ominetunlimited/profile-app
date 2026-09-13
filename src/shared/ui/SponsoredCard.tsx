import type { AdCampaign } from '@/app/adStore'

/**
 * §7 Ad Placement Rules — a real feed item, inline in the list flow (never
 * an overlay, so it structurally cannot cover a post, comment, or
 * navigation), always carrying a real "Sponsored" label per §7's hard
 * "never trick the user into thinking an advert is organic activity" rule.
 */
export function SponsoredCard({ campaign }: { campaign: AdCampaign }) {
  return (
    <article className="rounded-xl border border-dashed border-accent/50 bg-surface p-4">
      <div className="mb-2 flex items-center gap-2 text-xs text-text-2">
        <span className="rounded-full bg-accent/10 px-2 py-0.5 font-semibold text-accent">Sponsored</span>
        <span className="rounded-full border border-border px-2 py-0.5">{campaign.adType}</span>
      </div>
      <h2 className="mb-1 font-semibold text-text-0">{campaign.title}</h2>
      <p className="mb-3 text-sm text-text-1">{campaign.description}</p>
      <a href={campaign.destination} className="text-xs font-semibold text-accent">
        Learn more →
      </a>
    </article>
  )
}
