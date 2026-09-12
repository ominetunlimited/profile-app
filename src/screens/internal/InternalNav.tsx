import { Link, useLocation } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'

const LINKS = [
  { to: '/mission-control', label: 'Mission Control' },
  { to: '/internal/ai-decision-log', label: 'AI Decision Log' },
  { to: '/internal/route-integrity', label: 'Route Integrity' },
  { to: '/internal/content-console', label: 'Content Console' },
]

const OWNER_LINKS = [{ to: '/internal/admin-management', label: 'Admin Management' }]

/** Shared nav strip across the staff-only internal tools — §3.4: never
 * exposed to any external account type, so this intentionally lives outside
 * AppShell rather than being added to it. Owner-only links (Admin Management,
 * B9) only render for staffRole === 'owner'. */
export function InternalNav() {
  const { pathname } = useLocation()
  const { staffRole, setAccount, setStaffRole } = useAccount()
  const links = staffRole === 'owner' ? [...LINKS, ...OWNER_LINKS] : LINKS

  return (
    <div className="flex flex-wrap items-center gap-1 border-b border-border bg-surface-sunken px-6 py-2">
      {links.map((l) => (
        <Link
          key={l.to}
          to={l.to}
          className={`rounded-lg px-2.5 py-1.5 text-xs font-semibold ${pathname === l.to ? 'bg-surface text-text-0' : 'text-text-1'}`}
        >
          {l.label}
        </Link>
      ))}
      <button
        onClick={() => {
          setAccount(null)
          setStaffRole(null)
        }}
        className="ml-auto rounded-lg px-2.5 py-1.5 text-xs font-semibold text-danger"
      >
        Sign out
      </button>
    </div>
  )
}
