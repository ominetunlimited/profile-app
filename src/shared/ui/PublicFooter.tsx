import { Link } from 'react-router-dom'

/** §6.9 GLOBAL_FOOTER_LINKS, grouped to match the Handoff's footer column layout. */
const FOOTER_COLUMNS: { title: string; links: { label: string; to: string }[] }[] = [
  {
    title: 'PROFILE',
    links: [
      { label: 'About', to: '/about' },
      { label: 'How it works', to: '/how-it-works' },
      { label: 'Blog & News', to: '/blog' },
    ],
  },
  {
    title: 'Trust & security',
    links: [
      { label: 'Trust Centre', to: '/trust' },
      { label: 'Security practices', to: '/security-practices' },
    ],
  },
  {
    title: 'Help',
    links: [
      { label: 'Help Centre', to: '/help' },
      { label: 'FAQ', to: '/help/faq' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Terms', to: '/terms' },
      { label: 'Privacy Policy', to: '/privacy' },
      { label: 'Cookie Policy', to: '/cookies' },
      { label: 'Identity & Authenticity Agreement', to: '/identity-agreement' },
      { label: 'Verification Routing Consent', to: '/verification-consent' },
      { label: 'Professional Conduct Standards', to: '/conduct' },
      { label: 'Data Processing Agreement', to: '/dpa' },
      { label: 'Acceptable Use Policy', to: '/acceptable-use' },
      { label: 'Copyright & IP', to: '/copyright' },
      { label: 'Community Guidelines', to: '/community-guidelines' },
    ],
  },
]

export function PublicFooter() {
  return (
    <footer className="border-t border-border bg-surface-sunken px-4 py-11 sm:px-8">
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-7 grid grid-cols-2 gap-6 sm:grid-cols-4">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.title}>
              <div className="mb-2.5 text-xs font-semibold text-text-0">{col.title}</div>
              <div className="flex flex-col gap-2">
                {col.links.map((l) => (
                  <Link key={l.to} to={l.to} className="text-xs text-text-1 hover:text-text-0">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border pt-5">
          <span className="font-mono text-xs text-text-2">Verified Work. Trusted Identity.</span>
          <div className="flex gap-2">
            <Link to="/auth" className="flex h-[34px] items-center rounded-lg border border-border-strong px-3 text-xs font-semibold text-text-0">
              Sign In
            </Link>
            <Link to="/auth?mode=signup" className="flex h-[34px] items-center rounded-lg bg-accent px-3.5 text-xs font-semibold text-white">
              Open Your PROFILE
            </Link>
          </div>
        </div>
      </div>
    </footer>
  )
}
