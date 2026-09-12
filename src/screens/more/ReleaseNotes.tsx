import { AppShell } from '@/shared/ui/AppShell'

/**
 * Real changelog reflecting this build's actual phase history — not
 * marketing copy. Each entry corresponds to a real, verifiable body of work
 * in this codebase's own build sequence.
 */
const RELEASES = [
  {
    label: 'Design Recovery & Navigation Patch',
    items: [
      'Account-aware navigation: top bar, Hamburger Menu, and mobile bottom tabs now surface every real screen in the build, not just five',
      'Real PROFILE brand assets (wordmark, mark, monochrome) wired into the header, auth, and onboarding instead of plain text',
      'Full 248-country/territory list with real ISO codes and calling codes, replacing a 15-country placeholder',
      'Profile photo and cover image upload, with real preview/persistence',
      'Global search across routes, people, and organisations',
      'Accessibility settings (reduce motion, high contrast, text size, screen-reader mode) now actually apply',
    ],
  },
  { label: 'Phase 7 — Hardening & Activation Audit', items: ['Closed several "present but non-functional" gaps (Trust Score, Home reactions, onboarding checklist)', 'Portfolio Organisation composability', 'Owner/Internal secondary access gate'] },
  { label: 'Pre-Phase-7 Patch', items: ['CV header & sub-schema fields (education, certifications, languages, references)', 'Store Hub', 'Owner Content Console', 'Owner role & scoped Admins'] },
  { label: 'Phase 6 — Cross-Platform', items: ['i18n & RTL support (10 languages)', 'Command palette (Ctrl+K)', 'Mobile responsiveness fixes'] },
  { label: 'Phase 5 — Owner / Internal Tools', items: ['Mission Control', 'AI Decision Log', 'Route Integrity Engine'] },
  { label: 'Phase 4 — Organisation / Institution / Government', items: ['Organisation, Institution, and Government workspaces', 'Credential Schema Builder', 'Verification Review'] },
  { label: 'Phase 3 — Career Engine', items: ['10 CV templates and 10 Portfolio templates', 'Cover Letter, Advisor & Creator Hub, Creator Marketplace & Earnings'] },
  { label: 'Phase 2 — Core Individual Product', items: ['Home, Profile & Trust, Settings, Notifications, Opportunity Hub, Messaging, Communities, Disputes, Learning'] },
  { label: 'Phase 1 — Public Site & Auth', items: ['Public marketing pages, full account-creation flow, onboarding'] },
  { label: 'Phase 0 — Foundation', items: ['Route registry, AccountContext, design token system'] },
]

export function ReleaseNotes() {
  return (
    <AppShell>
      <div className="mx-auto max-w-[700px] px-4 py-8 sm:px-6">
        <h1 className="mb-6 text-2xl font-bold tracking-tight text-text-0">Release Notes</h1>
        <div className="flex flex-col gap-6">
          {RELEASES.map((r) => (
            <div key={r.label} className="border-b border-border pb-6 last:border-0">
              <h2 className="mb-2 font-semibold text-text-0">{r.label}</h2>
              <ul className="flex flex-col gap-1 text-sm text-text-1">
                {r.items.map((i) => (
                  <li key={i}>· {i}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
    </AppShell>
  )
}
