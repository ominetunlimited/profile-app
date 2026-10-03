import { useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { buildPortfolioData } from '@/app/portfolioData'
import { getOrgPortfolioConfig, saveOrgPortfolioConfig, ORG_PORTFOLIO_SECTIONS, type OrgPortfolioSection, useOrgPortfolioVersion } from '@/app/organisationPortfolioStore'
import { PORTFOLIO_TEMPLATES } from './portfolioTemplates'

/** §47.6 Portfolio Template Library — available to both account types
 * (§15.4's universal hard rule), scoped per account type: individuals choose
 * among the 9 profession-oriented templates, organisations get the
 * Organisation / Company Showcase template built for §15.2's org sections. */
export function PortfolioTemplatesPage() {
  const { template } = useParams<{ template: string }>()
  const navigate = useNavigate()
  const { account } = useAccount()
  const pf = buildPortfolioData(account)
  const isOrg = account?.accountType === 'organisation'
  const owner = account ? ownerKey(account) : ''
  useOrgPortfolioVersion()
  const orgConfig = (owner ? getOrgPortfolioConfig(owner) : null)

  const available = isOrg ? PORTFOLIO_TEMPLATES.filter((t) => t.id === 'organisation-company-showcase') : PORTFOLIO_TEMPLATES.filter((t) => t.id !== 'organisation-company-showcase')

  const initialIndex = Math.max(0, available.findIndex((t) => t.id === template))
  const [index, setIndex] = useState(initialIndex === -1 ? 0 : initialIndex)
  const active = available[index] ?? available[0]

  function toggleSection(section: OrgPortfolioSection) {
    if (!owner || !orgConfig) return
    const next = { enabledSections: { ...orgConfig.enabledSections, [section]: !orgConfig.enabledSections[section] } }
    saveOrgPortfolioConfig(owner, next)
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1080px] px-4 py-8 sm:px-6">
        <div className="mb-2 font-mono text-[11px] uppercase tracking-widest text-text-2">Career Engine · Portfolio templates</div>
        <h1 className="mb-5 text-2xl font-bold tracking-tight text-text-0">{available.length} portfolio template{available.length === 1 ? '' : 's'}</h1>

        {available.length > 1 && (
          <div role="tablist" className="mb-6 flex flex-wrap gap-2">
            {available.map((t, i) => (
              <button
                key={t.id}
                onClick={() => {
                  setIndex(i)
                  navigate(`/career/portfolio/${t.id}`, { replace: true })
                }}
                className={`rounded-lg border-[1.5px] px-3.5 py-2 text-xs font-semibold ${i === index ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'}`}
              >
                {t.label}
              </button>
            ))}
          </div>
        )}
        <p className="mb-6 text-xs text-text-1">{active.description}</p>

        {isOrg && orgConfig && (
          <div className="mb-6 rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 font-semibold text-text-0">Sections shown</div>
            <p className="mb-3 text-xs text-text-1">
              Toggle which sections appear on your Showcase. Header and Footer are structural and can't be hidden.
            </p>
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {ORG_PORTFOLIO_SECTIONS.filter((s) => !s.structural).map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-xs text-text-0">
                  <input type="checkbox" checked={orgConfig.enabledSections[s.value]} onChange={() => toggleSection(s.value)} />
                  {s.label}
                </label>
              ))}
            </div>
          </div>
        )}

        <div className="mb-8 rounded-xl bg-surface-sunken p-6">
          <active.Component pf={pf} config={orgConfig ?? undefined} />
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <InfoCard title="Mandatory visibility" body="Unlike a CV, Portfolio has no visibility toggle — it's shown to anyone who can view this profile at all." />
          <InfoCard title="Same record set, different structure" body="Every template pulls from the same recorded activities — the difference is which facts a given audience needs first." />
        </div>
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
