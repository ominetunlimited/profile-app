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
            <p className="text-sm text-text-1">Review organisation verification claims.</p>
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
            <p className="text-sm text-text-1">What needs a decision, and the platform at a glance.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'verification_queue') && (
          <Link to="/admin/verification-requests" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Unrouted requests</div>
            <p className="text-sm text-text-1">Verification requests naming an institution that isn't on PROFILE.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'data_requests') && (
          <Link to="/admin/data-requests" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Data requests</div>
            <p className="text-sm text-text-1">Corrections, consent withdrawals, appeals and account deletions.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'data_requests') && (
          <Link to="/admin/disputes" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Disputes &amp; appeals</div>
            <p className="text-sm text-text-1">Examine both sides and record a written outcome.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'mission_control') && (
          <Link to="/admin/ai-decision-log" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">AI decision log</div>
            <p className="text-sm text-text-1">Every AI output that touched a user, and whether it was reviewed.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'platform_settings') && (
          <Link to="/admin/settings" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Support &amp; alerts</div>
            <p className="text-sm text-text-1">Support email, phone and customer care number, and Telegram alerts for your team.</p>
          </Link>
        )}
        {platformRoleCan(admin.role, 'mission_control') && (
          <Link to="/admin/route-integrity" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
            <div className="mb-1 font-semibold text-text-0">Route integrity</div>
            <p className="text-sm text-text-1">Every registered route and whether it is in good order.</p>
          </Link>
        )}
      </div>
    </div>
  )
}
