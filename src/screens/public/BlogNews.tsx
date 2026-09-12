import { useState } from 'react'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'

const FEEDS = ['Blog', 'News'] as const

/** Editorial content, two distinct feeds (build doc §5 Phase 2). No CMS exists yet —
 * an honest empty state per §49.8, not fabricated articles. */
export function BlogNews() {
  const [feed, setFeed] = useState<(typeof FEEDS)[number]>('Blog')

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[880px] px-4 py-14 sm:px-8">
        <h1 className="mb-6 text-3xl font-bold tracking-tight text-text-0">Blog & News</h1>
        <div className="mb-8 flex gap-2 border-b border-border">
          {FEEDS.map((f) => (
            <button
              key={f}
              onClick={() => setFeed(f)}
              className={`border-b-2 px-1 pb-3 text-sm font-semibold ${
                feed === f ? 'border-accent text-text-0' : 'border-transparent text-text-1'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center">
          <p className="mb-1 font-semibold text-text-0">No {feed.toLowerCase()} posts published yet</p>
          <p className="max-w-sm text-sm text-text-1">
            This feed is ready to receive real editorial content — nothing here is placeholder text standing in for
            articles.
          </p>
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
