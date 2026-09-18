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

  return (
    <AppShell>
      <div className="mx-auto max-w-[1000px] px-4 pt-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Settings &amp; Privacy</h1>
      </div>
      <div className="mx-auto flex max-w-[1000px] gap-6 px-4 pb-8 sm:px-6">
        <nav aria-label="Settings sections" className="hidden w-52 flex-none flex-col gap-0.5 sm:flex">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => {
                setActive(key)
                setParams({ tab: key })
              }}
              className={`rounded-lg px-3 py-2 text-left text-sm ${active === key ? 'bg-surface-sunken font-semibold text-text-0' : 'text-text-1'}`}
            >
              {label}
            </button>
          ))}
        </nav>
        <div className="min-w-0 flex-1">
          <select
            className="mb-4 w-full rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm sm:hidden"
            value={active}
            onChange={(e) => {
              setActive(e.target.value)
              setParams({ tab: e.target.value })
            }}
          >
            {tabs.map(([key, label]) => (
              <option key={key} value={key}>
                {label}
              </option>
            ))}
          </select>
          <ActiveComponent />
        </div>
      </div>
    </AppShell>
  )
}
