import { useState } from 'react'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { Button } from '@/shared/ui/Button'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { createDraftTemplate, listCreatorTemplates } from '@/app/creatorTemplateStore'

const TABS = ['advisor', 'creator-hub'] as const

/**
 * §48.10 PROFILE Advisor + §47.13 Creator Hub, combined per the Handoff's
 * single screen. Advisor's chat is honestly disconnected — §48.0 forbids
 * fabricating confidence or output, and no AI Gateway (§48.11) exists in this
 * build, so it says so plainly rather than faking canned replies dressed up
 * as intelligent guidance.
 */
export function AdvisorCreatorHub() {
  const [tab, setTab] = useState<(typeof TABS)[number]>('advisor')
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [templates, setTemplates] = useState(() => listCreatorTemplates(owner))
  const [message, setMessage] = useState('')
  const [asked, setAsked] = useState(false)

  return (
    <AppShell>
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-2">Career Engine</div>
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">PROFILE Advisor &amp; Creator Hub</h1>

        <div role="tablist" className="mb-6 flex gap-5 border-b border-border">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`-mb-px border-b-2 pb-3 text-sm font-semibold capitalize ${tab === t ? 'border-accent text-text-0' : 'border-transparent text-text-1'}`}
            >
              {t.replace('-', ' ')}
            </button>
          ))}
        </div>

        {tab === 'advisor' && (
          <div className="flex flex-wrap gap-5">
            <div className="flex min-w-0 flex-1 basis-[400px] flex-col gap-3">
              {asked && (
                <div className="rounded-xl border border-border bg-surface p-3.5">
                  <div className="mb-1 font-mono text-[9.5px] font-semibold tracking-widest text-trust">ADVISOR</div>
                  <p className="text-sm text-text-0">
                    PROFILE Advisor requires the AI Gateway backend (§48.11) — not yet connected in this build. I can't
                    answer that honestly without it, so I won't pretend to.
                  </p>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Ask about your profile, a role, or what's missing"
                  className="min-h-[44px] flex-1 rounded-lg border border-border-strong bg-surface px-3 text-sm outline-none focus-visible:border-accent"
                />
                <Button
                  disabled={!message.trim()}
                  onClick={() => {
                    setAsked(true)
                    setMessage('')
                  }}
                >
                  Ask
                </Button>
              </div>
            </div>
            <div className="flex min-w-[230px] flex-1 basis-[250px] flex-col gap-3">
              <InfoCard title="What Advisor can do" body="Explain a Trust Score, find the gap between your records and a role, suggest what to record next. It never asserts a credential, fabricates an achievement, or guarantees an outcome." />
              <InfoCard title="Every answer traces to a record" body="Answers cite the specific verified records they draw from — shown, not hidden behind the reply." />
            </div>
          </div>
        )}

        {tab === 'creator-hub' && (
          <div>
            <p className="mb-5 max-w-[64ch] text-sm text-text-1">
              CV and portfolio templates you can publish for others to use, with your name attached and earnings
              tracked. Draft until you publish — never live by accident.
            </p>
            <div className="mb-6 grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
              {templates.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-sm text-text-1 sm:col-span-2 lg:col-span-3">
                  No templates started yet.
                </div>
              ) : (
                templates.map((t) => (
                  <div key={t.id} className="rounded-xl border border-border bg-surface p-4 shadow-sm">
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="font-semibold text-text-0">{t.name}</span>
                      <span className={`rounded-full border px-2 py-0.5 text-[10.5px] font-semibold ${t.status === 'published' ? 'border-success text-success' : 'border-warning text-warning'}`}>
                        {t.status}
                      </span>
                    </div>
                    <div className="mb-2 text-xs text-text-1">{t.type === 'cv' ? 'CV template' : 'Portfolio template'}</div>
                    <div className="text-xs text-text-1">{t.uses} uses{t.status === 'published' ? ` · ₦${t.earnings.toLocaleString()} earned` : ''}</div>
                  </div>
                ))
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  createDraftTemplate(owner, `Untitled template ${templates.length + 1}`, 'cv')
                  setTemplates(listCreatorTemplates(owner))
                }}
              >
                Start a new template
              </Button>
              <Link to="/career/earnings" className="flex min-h-[44px] items-center rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-0">
                View earnings &amp; analytics
              </Link>
              <Link to="/career/marketplace" className="flex min-h-[44px] items-center rounded-lg border border-border-strong px-4 text-sm font-semibold text-text-0">
                Browse marketplace
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

function InfoCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <div className="mb-1.5 font-semibold text-text-0">{title}</div>
      <p className="text-xs leading-relaxed text-text-1">{body}</p>
    </div>
  )
}
