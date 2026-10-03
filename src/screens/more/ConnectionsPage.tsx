import { useEffect, useState, type ReactNode } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { acceptConnectionRequest, listConnectionRecordsFor, onConnectionsChange, removeConnection, type ConnectionRecord } from '@/app/connectionStore'
import { findAccountByEmail } from '@/app/demoAccountStore'

/**
 * §10.1 Mobile Bottom Navigation's "connections" tab. Previously honestly
 * empty because no connection-request pipeline existed anywhere in this
 * build; connectionStore.ts (built for ProfilePage's real Connect button)
 * now makes this real — every actual request/acceptance this account is
 * party to, not fabricated contacts.
 */
export function ConnectionsPage() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [records, setRecords] = useState(() => listConnectionRecordsFor(owner))

  function refresh() {
    setRecords(listConnectionRecordsFor(owner))
  }

  // Pipeline repair Phase A: the connections cache loads asynchronously (and
  // receives a Realtime push, e.g. someone accepting your request from
  // another device) — without this, this list would freeze at whatever the
  // cache held on mount.
  useEffect(() => onConnectionsChange(refresh), [owner])

  const accepted = records.filter((r) => r.status === 'accepted')
  const receivedPending = records.filter((r) => r.status === 'pending' && r.recipientEmail.toLowerCase() === owner.toLowerCase())
  const sentPending = records.filter((r) => r.status === 'pending' && r.requesterEmail.toLowerCase() === owner.toLowerCase())

  function otherEmail(r: ConnectionRecord): string {
    return r.requesterEmail.toLowerCase() === owner.toLowerCase() ? r.recipientEmail : r.requesterEmail
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Connections</h1>
        <p className="mb-6 text-sm text-text-1">Use Search in the header to find people and organisations, then Connect from their profile.</p>

        {receivedPending.length > 0 && (
          <section className="mb-6">
            <h2 className="mb-2 text-sm font-semibold text-text-0">Requests</h2>
            <div className="flex flex-col gap-2">
              {receivedPending.map((r) => (
                <PersonRow key={r.id} email={otherEmail(r)}>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await acceptConnectionRequest(owner, otherEmail(r))
                        refresh()
                      }}
                      className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white"
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        await removeConnection(owner, otherEmail(r))
                        refresh()
                      }}
                      className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-1"
                    >
                      Decline
                    </button>
                  </div>
                </PersonRow>
              ))}
            </div>
          </section>
        )}

        <section className="mb-6">
          <h2 className="mb-2 text-sm font-semibold text-text-0">Connections ({accepted.length})</h2>
          {accepted.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-8 text-center text-sm text-text-1">
              No connections yet — this is a real request/accept pipeline, not fabricated contacts.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {accepted.map((r) => (
                <PersonRow key={r.id} email={otherEmail(r)} />
              ))}
            </div>
          )}
        </section>

        {sentPending.length > 0 && (
          <section>
            <h2 className="mb-2 text-sm font-semibold text-text-0">Pending ({sentPending.length})</h2>
            <div className="flex flex-col gap-2">
              {sentPending.map((r) => (
                <PersonRow key={r.id} email={otherEmail(r)}>
                  <span className="text-xs text-text-2">Request sent</span>
                </PersonRow>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

function PersonRow({ email, children }: { email: string; children?: ReactNode }) {
  const person = findAccountByEmail(email)
  const username = person && 'username' in person ? person.username : undefined
  const name = person?.legalName ?? email

  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3">
      <UserAvatar ownerEmail={email} name={name} size={36} />
      <div className="min-w-0 flex-1">
        {username ? (
          <Link to={`/profile/${username}`} className="truncate text-sm font-semibold text-text-0 hover:text-accent">
            {name}
          </Link>
        ) : (
          <span className="truncate text-sm font-semibold text-text-0">{name}</span>
        )}
      </div>
      {children}
    </div>
  )
}
