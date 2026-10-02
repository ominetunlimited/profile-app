import type { ReactNode } from 'react'
import { Link, Navigate, useLocation } from 'react-router-dom'
import { useAdmin } from '@/app/AdminContext'
import { PLATFORM_ROLE_LABEL, platformRoleCan, type AdminModule } from '@/app/platformAdminStore'
import { BRAND } from '@/shared/brand/assets'

const NAV: { to: string; label: string; module: AdminModule | null }[] = [
  { to: '/admin', label: 'Dashboard', module: null },
  { to: '/admin/users', label: 'Users & Roles', module: 'user_role_management' },
  { to: '/admin/verification', label: 'Verification Queue', module: 'verification_queue' },
  { to: '/admin/content', label: 'Content Moderation', module: 'content_moderation' },
  { to: '/admin/communities', label: 'Communities', module: 'content_moderation' },
  { to: '/admin/mission-control', label: 'Mission Control', module: 'mission_control' },
]

/** Real gate for the whole `/admin/*` tree — checks the live
 * `platform_admins` row (AdminContext), never `AccountContext`'s dev-only
 * `staffRole`. Redirects to the Admin Centre's own login page, not the
 * consumer `/auth`. */
export function RequirePlatformAdmin({ children }: { children: ReactNode }) {
  const { admin, loading } = useAdmin()
  const location = useLocation()
  if (loading) return null
  if (!admin) return <Navigate to={`/admin/login?return=${encodeURIComponent(location.pathname)}`} replace />
  return <>{children}</>
}

/**
 * WordPress-wp-admin-style shell: a fixed left sidebar, filtered to the
 * modules the signed-in admin's role actually permits
 * (platformRoleCan/PLATFORM_PERMISSION_MATRIX) — a moderator never even
 * sees a "Users & Roles" link, not just gets denied after clicking it.
 */
export function AdminShell({ children }: { children: ReactNode }) {
  const { admin, signOut } = useAdmin()
  const { pathname } = useLocation()
  if (!admin) return null

  const items = NAV.filter((item) => !item.module || platformRoleCan(admin.role, item.module))

  return (
    <div className="flex min-h-screen bg-bg">
      <aside className="flex w-60 flex-none flex-col border-r border-border bg-surface">
        <div className="flex items-center gap-2 border-b border-border px-5 py-4">
          <img src={BRAND.lockup} alt="PROFILE" className="h-5 w-auto" />
          <span className="rounded-full bg-surface-sunken px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-text-2">Admin</span>
        </div>
        <nav className="flex flex-1 flex-col gap-0.5 p-3">
          {items.map((item) => (
            <Link
              key={item.to}
              to={item.to}
              className={`rounded-lg px-3 py-2 text-sm font-medium ${pathname === item.to ? 'bg-surface-sunken text-text-0' : 'text-text-1 hover:bg-surface-sunken'}`}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="border-t border-border p-3">
          <div className="mb-2 px-2">
            <div className="truncate text-xs font-semibold text-text-0">{admin.displayName ?? admin.email}</div>
            <div className="text-[11px] text-text-2">{PLATFORM_ROLE_LABEL[admin.role]}</div>
          </div>
          <button onClick={() => signOut()} className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-surface-sunken">
            Sign out
          </button>
        </div>
      </aside>
      <main className="min-w-0 flex-1 px-8 py-8">{children}</main>
    </div>
  )
}
