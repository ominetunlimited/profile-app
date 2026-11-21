import { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import {
  AccessibilityTab,
  AiAssistantTab,
  CareerJourneyTab,
  CommerceTab,
  CvExportTab,
  DataRightsTab,
  LanguageTab,
  MentorshipTab,
  NotificationsTab,
  OrganisationTab,
  PremiumPlansTab,
  PrivacyTab,
  ProfileTab,
  SecurityTab,
} from './settingsTabs'

const SHARED_TABS = [
  ['profile', 'Profile', ProfileTab],
  ['privacy', 'Privacy & Visibility', PrivacyTab],
  ['notifications', 'Notifications', NotificationsTab],
  ['commerce', 'Commerce & Selling', CommerceTab],
  ['ai-assistant', 'AI Assistant', AiAssistantTab],
  ['security', 'Security', SecurityTab],
  ['language', 'Language & Region', LanguageTab],
  ['accessibility', 'Accessibility', AccessibilityTab],
  ['data-rights', 'Data Rights', DataRightsTab],
  ['premium', 'Premium Plans', PremiumPlansTab],
] as const

// §25's own tabs — CV/Portfolio, career stage, and mentorship are individual
// concepts with no organisation equivalent (an org has no CV, no personal
// career stage, no mentor capacity). §25.2 explicitly calls the organisation
// side "parallel structure", not this set plus one bolted-on extra tab —
// previously an org account saw all three of these anyway.
const INDIVIDUAL_ONLY_TABS = [
  ['cv-export', 'CV & Export', CvExportTab],
  ['career-journey', 'Career Journey', CareerJourneyTab],
  ['mentorship', 'Mentorship', MentorshipTab],
] as const

const ORG_EXTRA_TABS = [['organisation', 'Organisation', OrganisationTab]] as const

/** §25 Settings — the full SETTINGS_TABS structure, plus §25.2 for organisations. */
export function SettingsPage() {
  const { account } = useAccount()
  const [params, setParams] = useSearchParams()
  const tabs = account?.accountType === 'organisation' ? [...ORG_EXTRA_TABS, ...SHARED_TABS] : [...SHARED_TABS, ...INDIVIDUAL_ONLY_TABS]
  const [active, setActive] = useState(params.get('tab') ?? tabs[0][0])

  const ActiveComponent = tabs.find((t) => t[0] === active)?.[2] ?? tabs[0][2]

  const choose = (key: string) => {
    setActive(key)
    setParams({ tab: key })
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1080px] px-4 pb-16 pt-6 sm:px-8">
        <header className="mb-6">
          <h1 className="text-[clamp(24px,3.4vw,34px)] font-bold leading-tight tracking-tight text-text-0">Settings &amp; Privacy</h1>
          <p className="mt-1.5 max-w-[60ch] text-[14px] leading-relaxed text-text-1">You decide what is public, who can reach you and how your data is used.</p>
        </header>

        <div className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:hidden" role="tablist" aria-label="Settings sections">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              role="tab"
              aria-selected={active === key}
              onClick={() => choose(key)}
              className={`shrink-0 whitespace-nowrap rounded-full border-[1.5px] px-4 py-2 text-[12.5px] font-semibold ${
                active === key ? 'border-accent bg-accent-soft text-accent' : 'border-border text-text-1'
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        <div className="grid gap-6 sm:grid-cols-[230px_minmax(0,1fr)] sm:items-start">
          <nav aria-label="Settings sections" className="hidden flex-col gap-0.5 rounded-2xl border border-border bg-surface p-2 sm:sticky sm:top-20 sm:flex">
            {tabs.map(([key, label]) => (
              <button
                key={key}
                onClick={() => choose(key)}
                aria-current={active === key ? 'page' : undefined}
                className={`relative min-h-[42px] rounded-xl px-3.5 py-2 text-left text-[14px] ${
                  active === key ? 'bg-accent-soft font-semibold text-accent' : 'text-text-1 hover:bg-surface-sunken'
                }`}
              >
                {label}
              </button>
            ))}
          </nav>
          <div className="flex min-w-0 flex-col gap-4">
            <ActiveComponent />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
