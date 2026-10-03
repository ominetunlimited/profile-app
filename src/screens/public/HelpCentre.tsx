import { useState } from 'react'
import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { FAQ_ITEMS } from './legal/faqContent'
import { usePlatformSettings } from '@/app/platformSettings'

const ARTICLES = [
  { title: 'How does verification work?', body: 'An institution or employer confirms your record directly — PROFILE never verifies on their behalf.' },
  { title: 'Why was my record rejected?', body: "Common causes: date mismatch, wrong institution selected, or the verifier couldn't confirm your role. You can always dispute." },
  { title: 'How is my Trust Score calculated?', body: 'From capped inputs, each tied to something that was confirmed — identity, employment, academic degrees, licences and more. Nothing counts followers, likes or views.' },
  { title: 'Can I hide my Trust Score?', body: 'No — verified badges and Trust Score always stay visible so a claim is never shown without its evidence trail.' },
  { title: 'How do I dispute a rejected record?', body: 'Go to Trust Centre → Disagreements get a human, or open the record directly and select Dispute.' },
  { title: 'What can PROFILE Advisor see?', body: 'Only what you give it in the conversation. It never fabricates a credential or achievement.' },
  { title: 'How do I delete my account?', body: 'Settings → Data Rights → Delete account. Records independently confirmed by an institution may remain in their system.' },
  { title: 'How do organisation workspaces get approved?', body: 'A person with a personal PROFILE account requests it with an official-domain email; a PROFILE reviewer confirms the domain.' },
]

const CATEGORIES = [
  { title: 'Getting started', body: 'Account creation, your first record, understanding onboarding.', search: 'account' },
  { title: 'Verification', body: 'How confirmation works, rejection, disputes and appeals.', search: 'verif' },
  { title: 'Trust Score', body: "What it measures, how it's calculated, what it doesn't count.", search: 'trust score' },
  { title: 'Career Engine', body: 'CV, Portfolio, Cover Letter, and how evidence powers each.', search: 'cv' },
  { title: 'Organisations & institutions', body: 'Workspace setup, staff roles, bulk verification.', search: 'organisation' },
  { title: 'Privacy & security', body: 'Visibility settings, data export, account deletion.', search: 'privacy' },
]

/** Help Centre: search the articles, or browse by topic. */
export function HelpCentre() {
  const [query, setQuery] = useState('')
  const contact = usePlatformSettings()
  const contactRows: [string, string, string | null][] = contact
    ? [
        ['Email', contact.support_email ?? '', contact.support_email ? `mailto:${contact.support_email}` : null],
        ['Phone', contact.support_phone ?? '', contact.support_phone ? `tel:${contact.support_phone.replace(/\s+/g, '')}` : null],
        ['Customer care', contact.customer_care_number ?? '', contact.customer_care_number ? `tel:${contact.customer_care_number.replace(/\s+/g, '')}` : null],
        ['WhatsApp', contact.whatsapp_number ?? '', contact.whatsapp_number ? `https://wa.me/${contact.whatsapp_number.replace(/[^\d]/g, '')}` : null],
        ['Hours', contact.support_hours ?? '', null],
        ['Office', contact.support_address ?? '', null],
        ['Service status', contact.status_page_url ?? '', contact.status_page_url],
      ]
    : []
  const shownContact = contactRows.filter(([, v]) => v)
  const q = query.trim().toLowerCase()
  const results = q
    ? [
        ...ARTICLES.filter((a) => a.title.toLowerCase().includes(q) || a.body.toLowerCase().includes(q)),
        ...FAQ_ITEMS.filter((f) => (f.q.toLowerCase().includes(q) || f.a.toLowerCase().includes(q)) && !ARTICLES.some((a) => a.title === f.q)).map((f) => ({ title: f.q, body: f.a })),
      ]
    : []

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[880px] px-4 pb-16 pt-10 sm:px-7">
        <h1 className="mb-3.5 text-center text-[26px] font-bold leading-tight tracking-tight text-text-0">How can we help?</h1>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search help articles…"
          aria-label="Search help articles"
          className="mb-[22px] min-h-[48px] w-full rounded-[11px] border border-border-strong bg-surface px-4 text-sm text-text-0 outline-none focus-visible:border-accent"
        />

        {q ? (
          <section aria-live="polite">
            <div className="mb-3 text-xs font-semibold text-text-1">
              {results.length} result{results.length === 1 ? '' : 's'}
            </div>
            <div className="flex flex-col gap-[9px]">
              {results.map((a) => (
                <div key={a.title} className="rounded-[11px] border border-border bg-surface px-4 py-[13px]">
                  <div className="mb-1 text-[13px] font-semibold text-text-0">{a.title}</div>
                  <div className="text-xs leading-relaxed text-text-1">{a.body}</div>
                </div>
              ))}
              {results.length === 0 && <p className="text-sm text-text-1">No matches — try the full FAQ library below.</p>}
            </div>
          </section>
        ) : (
          <div className="grid grid-cols-[repeat(auto-fit,minmax(min(100%,240px),1fr))] gap-3">
            {CATEGORIES.map((c) => (
              <button
                key={c.title}
                type="button"
                onClick={() => setQuery(c.search)}
                className="rounded-xl border border-border bg-surface px-4 py-[15px] text-start shadow-sm hover:border-accent"
              >
                <div className="mb-1.5 text-[13px] font-semibold text-text-0">{c.title}</div>
                <div className="text-[11.5px] leading-normal text-text-1">{c.body}</div>
              </button>
            ))}
          </div>
        )}

        {shownContact.length > 0 && (
          <section className="mt-10 rounded-xl border border-border bg-surface p-5" aria-labelledby="contact-support">
            <h2 id="contact-support" className="mb-3 text-[13px] font-semibold text-text-0">Still need help? Contact us</h2>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {shownContact.map(([label, value, href]) => (
                <div key={label}>
                  <dt className="text-xs text-text-2">{label}</dt>
                  <dd className="text-text-0">
                    {href ? (
                      <a href={href} className="font-medium text-accent" target={href.startsWith('http') ? '_blank' : undefined} rel="noreferrer">
                        {value}
                      </a>
                    ) : (
                      value
                    )}
                  </dd>
                </div>
              ))}
            </dl>
          </section>
        )}

        <p className="mt-10 text-center text-sm text-text-1">
          Looking for the full question list? Visit the{' '}
          <Link to="/help/faq" className="font-semibold text-accent">
            FAQ Library
          </Link>
          .
        </p>
      </main>
      <PublicFooter />
    </div>
  )
}
