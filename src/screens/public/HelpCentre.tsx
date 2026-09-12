import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { FAQ_ITEMS } from './legal/faqContent'

/** §37.10 SUPPORT_ECOSYSTEM categories. */
const CATEGORIES = [
  { title: 'Knowledge base', body: 'Guides for building your profile, requesting verification, and using the Trust Center.' },
  { title: 'Scam protection centre', body: 'How to spot and report impersonation, phishing, or credential fraud.' },
  { title: 'Safety tips', body: 'Keeping your account and identity documents secure.' },
  { title: 'Account status', body: 'Check the status of your account, verification requests, or a filed dispute.' },
  { title: 'Report a problem', body: "Something not working the way it should? Tell us what happened." },
  { title: 'Report abuse', body: 'Report harassment, impersonation, or a Professional Conduct Standards violation.' },
  { title: 'Appeal a verification decision', body: 'Every rejected record can be disputed within 14 days.' },
  { title: 'System status', body: 'Live status of PROFILE services.' },
]

/** §37.10 Help & Support Center. */
export function HelpCentre() {
  const [query, setQuery] = useState('')
  const filtered = FAQ_ITEMS.filter((f) => f.q.toLowerCase().includes(query.toLowerCase()))

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[880px] px-4 py-14 sm:px-8">
        <h1 className="mb-2 text-3xl font-bold tracking-tight text-text-0">Help Centre</h1>
        <p className="mb-6 text-text-1">Search the knowledge base, or browse a category below.</p>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles and FAQs…"
          aria-label="Search help articles and FAQs"
          className="mb-10 min-h-[48px] w-full rounded-lg border border-border-strong bg-surface px-4 text-sm text-text-0 outline-none focus-visible:border-accent"
        />

        {query ? (
          <section>
            <h2 className="mb-3 text-sm font-semibold text-text-1">
              {filtered.length} result{filtered.length === 1 ? '' : 's'}
            </h2>
            <div className="flex flex-col gap-2">
              {filtered.map((f) => (
                <div key={f.q} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-1 font-medium text-text-0">{f.q}</div>
                  <div className="text-sm text-text-1">{f.a}</div>
                </div>
              ))}
              {filtered.length === 0 && <p className="text-sm text-text-1">No matches — try the full FAQ library.</p>}
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CATEGORIES.map((c) => (
              <div key={c.title} className="rounded-xl border border-border bg-surface p-4">
                <div className="mb-1.5 font-semibold text-text-0">{c.title}</div>
                <div className="text-sm text-text-1">{c.body}</div>
              </div>
            ))}
          </div>
        )}

        <div className="mt-10 rounded-xl border border-border bg-surface-sunken p-5 text-sm text-text-1">
          Looking for the full question list? Visit the{' '}
          <Link to="/help/faq" className="font-semibold text-accent">
            FAQ Library
          </Link>
          .
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
