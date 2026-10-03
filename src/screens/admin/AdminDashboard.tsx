import { Link } from 'react-router-dom'
import { useAdmin } from '@/app/AdminContext'
import { PLATFORM_ROLE_LABEL, platformRoleCan } from '@/app/platformAdminStore'

export function AdminDashboard() {
  const { admin } = useAdmin()
  if (!admin) return null

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Welcome, {admin.displayName ?? admin.email}</h1>
      <p className="mb-6 text-sm text-text-1">Signed in as {PLATFORM_ROLE_LABEL[admin.role]}.</p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {platformRoleCan(admin.role, 'user_role_management') && (
          <Link to="/admin/users" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Users & Roles</div>
            <p className="text-sm text-text-1">Invite admins, assign and revoke platform roles.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'verification_queue') && (
          <Link to="/admin/verification" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Verification Queue</div>
            <p className="text-sm text-text-1">Review organisation verification claims (§50.4 IOTR).</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'verification_queue') && (
          <Link to="/admin/kyc" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Identity (KYC)</div>
            <p className="text-sm text-text-1">Review submitted ID documents and selfies.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'content_moderation') && (
          <Link to="/admin/content" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Content Moderation</div>
            <p className="text-sm text-text-1">News, blog, and announcement posts.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'content_moderation') && (
          <Link to="/admin/communities" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Communities</div>
            <p className="text-sm text-text-1">Oversee communities, suspend, and work the reports queue.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'mission_control') && (
          <Link to="/admin/mission-control" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Mission Control</div>
            <p className="text-sm text-text-1">Route registry and platform health.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
