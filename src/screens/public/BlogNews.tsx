import { useState } from 'react'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { listOwnerContent } from '@/app/ownerContentStore'

const FEEDS = ['Blog', 'News'] as const

/**
 * Editorial content, two distinct feeds (build doc §5 Phase 2). Wired to the
 * Owner Content Console's real store (ownerContentStore.ts) — previously
 * this rendered a static empty state unconditionally even after staff
 * published something, since nothing read the store back. Still an honest
 * empty state per §49.8 when nothing has actually been published.
 */
export function BlogNews() {
  const [feed, setFeed] = useState<(typeof FEEDS)[number]>('Blog')
  const posts = listOwnerContent().filter((p) => p.status === 'published' && p.type === feed.toLowerCase())

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
        {posts.length === 0 ? (
          <div className="flex min-h-[220px] flex-col items-center justify-center rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center">
            <p className="mb-1 font-semibold text-text-0">No {feed.toLowerCase()} posts published yet</p>
            <p className="max-w-sm text-sm text-text-1">
              This feed is ready to receive real editorial content — nothing here is placeholder text standing in for
              articles.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            {posts.map((p) => (
              <article key={p.id} className="rounded-xl border border-border bg-surface p-5">
                {p.coverImage && <img src={p.coverImage} alt="" className="mb-3 h-40 w-full rounded-lg object-cover" />}
                <h2 className="mb-1 text-lg font-bold text-text-0">{p.title}</h2>
                <p className="mb-2 text-xs text-text-2">
                  {p.authorLabel} · {p.publishedAt ? new Date(p.publishedAt).toLocaleDateString() : ''}
                </p>
                <p className="text-sm text-text-1">{p.body}</p>
                {p.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5">
                    {p.tags.map((t) => (
                      <span key={t} className="rounded-full border border-border px-2 py-0.5 text-[10.5px] text-text-2">
                        {t}
                      </span>
                    ))}
                  </div>
                )}
              </article>
            ))}
          </div>
        )}
      </main>
      <PublicFooter />
    </div>
  )
}
