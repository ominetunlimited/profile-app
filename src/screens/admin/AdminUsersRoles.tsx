import { useEffect, useState } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Button } from '@/shared/ui/Button'
import { Field, SelectInput, TextInput } from '@/shared/ui/Field'
import { useAdmin } from '@/app/AdminContext'
import {
  invitePlatformAdmin,
  listPlatformAdmins,
  PLATFORM_ROLE_LABEL,
  PLATFORM_ROLES,
  setPlatformAdminStatus,
  updatePlatformAdminRole,
  type PlatformAdmin,
  type PlatformRole,
} from '@/app/platformAdminStore'

/**
 * The direct "roles can be assigned to multiple employees/admins" ask —
 * the wp-admin Users screen equivalent. Only a super_administrator can
 * reach this in practice (RLS on platform_admins enforces it server-side
 * too — this screen isn't the only thing standing between a lower role and
 * the roster).
 */
export function AdminUsersRoles() {
  const { admin: me } = useAdmin()
  const [admins, setAdmins] = useState<PlatformAdmin[]>([])
  const [loading, setLoading] = useState(true)
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<PlatformRole>('moderator')
  const [inviteResult, setInviteResult] = useState<{ email: string; temporaryPassword: string } | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    setLoading(true)
    setAdmins(await listPlatformAdmins())
    setLoading(false)
  }

  useEffect(() => {
    refresh()
  }, [])

  async function submitInvite() {
    setError(null)
    try {
      const { temporaryPassword } = await invitePlatformAdmin(inviteEmail.trim(), inviteRole, inviteName.trim())
      setInviteResult({ email: inviteEmail.trim(), temporaryPassword })
      setInviteEmail('')
      setInviteName('')
      setInviteRole('moderator')
      setInviteOpen(false)
      await refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not invite this admin.')
    }
  }

  const isSuperAdmin = me?.role === 'super_administrator'

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight text-text-0">Users & Roles</h1>
        {isSuperAdmin && <Button onClick={() => setInviteOpen((v) => !v)}>{inviteOpen ? 'Cancel' : '+ Invite admin'}</Button>}
      </div>

      {inviteResult && (
        <div role="alert" className="mb-5 rounded-lg border border-success bg-surface-sunken p-3.5 text-sm text-text-0">
          <p className="mb-1 font-semibold">Invited {inviteResult.email}.</p>
          <p className="mb-1">
            Temporary password: <code className="rounded bg-surface px-1.5 py-0.5 font-mono">{inviteResult.temporaryPassword}</code>
          </p>
          <p className="text-xs text-text-1">
            Share this out of band (not over email/chat this screen can see) — it isn't stored anywhere and won't be shown again.
          </p>
          <button onClick={() => setInviteResult(null)} className="mt-2 text-xs font-semibold text-accent">
            Dismiss
          </button>
        </div>
      )}

      {inviteOpen && isSuperAdmin && (
        <div className="mb-6 rounded-xl border border-border bg-surface p-4">
          <div className="mb-3.5 grid grid-cols-1 gap-3.5 sm:grid-cols-3">
            <Field label="Email">
              <TextInput value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="name@profile.com" />
            </Field>
            <Field label="Display name">
              <TextInput value={inviteName} onChange={(e) => setInviteName(e.target.value)} placeholder="Full name" />
            </Field>
            <Field label="Role">
              <SelectInput value={inviteRole} onChange={(e) => setInviteRole(e.target.value as PlatformRole)}>
                {PLATFORM_ROLES.map((r) => (
                  <option key={r} value={r}>
                    {PLATFORM_ROLE_LABEL[r]}
                  </option>
                ))}
              </SelectInput>
            </Field>
          </div>
          {error && (
            <p role="alert" className="mb-3 text-xs text-danger">
              {error}
            </p>
          )}
          <Button disabled={!inviteEmail.trim()} onClick={submitInvite}>
            Send invite
          </Button>
        </div>
      )}

      {loading ? (
        <p className="text-sm text-text-1">Loading…</p>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-surface-sunken text-xs uppercase tracking-wide text-text-2">
              <tr>
                <th className="px-4 py-3">Admin</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Added</th>
                {isSuperAdmin && <th className="px-4 py-3" />}
              </tr>
            </thead>
            <tbody>
              {admins.map((a) => (
                <tr key={a.id} className="border-t border-border bg-surface">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <UserAvatar ownerEmail={a.email} name={a.displayName ?? a.email} size={30} />
                      <div>
                        <div className="font-semibold text-text-0">{a.displayName ?? a.email}</div>
                        <div className="text-xs text-text-2">{a.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    {isSuperAdmin && a.id !== me?.id ? (
                      <SelectInput
                        value={a.role}
                        onChange={async (e) => {
                          await updatePlatformAdminRole(a.id, e.target.value as PlatformRole)
                          refresh()
                        }}
                      >
                        {PLATFORM_ROLES.map((r) => (
                          <option key={r} value={r}>
                            {PLATFORM_ROLE_LABEL[r]}
                          </option>
                        ))}
                      </SelectInput>
                    ) : (
                      PLATFORM_ROLE_LABEL[a.role]
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${a.status === 'active' ? 'bg-success-soft text-success' : 'bg-surface-sunken text-text-2'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-xs text-text-2">{new Date(a.createdAt).toLocaleDateString()}</td>
                  {isSuperAdmin && (
                    <td className="px-4 py-3">
                      {a.id !== me?.id && (
                        <button
                          onClick={async () => {
                            await setPlatformAdminStatus(a.id, a.status === 'active' ? 'revoked' : 'active')
                            refresh()
                          }}
                          className={`text-xs font-semibold ${a.status === 'active' ? 'text-danger' : 'text-accent'}`}
                        >
                          {a.status === 'active' ? 'Revoke' : 'Reactivate'}
                        </button>
                      )}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
