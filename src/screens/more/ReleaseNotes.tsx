import { AppShell } from '@/shared/ui/AppShell'

/** What's new in PROFILE, newest first. */
const RELEASES = [
  {
    label: 'October 2026',
    items: [
      'Real-time messaging: messages, typing indicators, reactions, replies, voice notes and file sharing arrive instantly',
      'Repost with your own comment, save posts, recommend, and share across posts, jobs and adverts',
      'Communities and groups you can create, moderate and chat in',
      'Notifications that group related activity and respect your preferences',
      'Personalised recommendations that explain why they were suggested',
      'Camera capture, on-device document scanning, and identity verification reviewed by a person',
    ],
  },
  {
    label: 'September 2026',
    items: [
      'Account-aware navigation across the top bar, menu and mobile tabs',
      'PROFILE brand assets throughout the header, sign-in and onboarding',
      'Full country and territory list with real calling codes',
      'Profile photo and cover image upload',
      'Global search across pages, people and organisations',
      'Accessibility settings (reduce motion, high contrast, text size, screen-reader mode) that apply across the app',
      'Ten languages with right-to-left support, and a Ctrl+K command palette',
      'Organisation, institution and government workspaces, Credential Schema Builder and Verification Review',
      'Ten CV templates and ten portfolio templates, Cover Letter, Advisor, Creator Hub and Marketplace',
    ],
  },
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
