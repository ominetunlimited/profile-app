import { useEffect, useState, type ReactNode } from 'react'
import { UserAvatar } from '@/shared/ui/UserAvatar'
import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { acceptConnectionRequest, connectionsInCommon, listConnectionRecordsFor, onConnectionsChange, removeConnection, sendConnectionRequest, type ConnectionRecord } from '@/app/connectionStore'
import { mutualLabel, suggestPeopleFor } from '@/app/connectionSuggestions'
import { findAccountByEmail, useAccountsCacheVersion } from '@/app/demoAccountStore'

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
  useAccountsCacheVersion()
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

  const suggestions = suggestPeopleFor(owner)
  const actionBtn = 'min-h-[44px] rounded-xl px-4 text-[13px] font-semibold'

  return (
    <AppShell>
      <div className="mx-auto max-w-[980px] px-4 pb-16 pt-6 sm:px-8">
        <header className="mb-6">
          <h1 className="text-[clamp(24px,3.4vw,34px)] font-bold leading-tight tracking-tight text-text-0">Connections</h1>
          <p className="mt-1.5 max-w-[60ch] text-[14px] leading-relaxed text-text-1">
            Use Search in the header to find people and organisations, then Connect from their profile.
          </p>
        </header>

        <dl className="mb-7 grid grid-cols-3 gap-3">
          {[
            ['Connections', accepted.length],
            ['Requests', receivedPending.length],
            ['Pending', sentPending.length],
          ].map(([label, n]) => (
            <div key={label as string} className="rounded-2xl border border-border bg-surface px-4 py-3.5">
              <dt className="text-[12px] font-medium text-text-1">{label}</dt>
              <dd className="mt-0.5 text-[clamp(24px,3vw,32px)] font-bold leading-none tracking-tight text-text-0">{n}</dd>
            </div>
          ))}
        </dl>

        {receivedPending.length > 0 && (
          <section className="mb-8 rounded-2xl border border-accent/30 bg-accent-soft p-4 sm:p-5" aria-labelledby="req-h">
            <h2 id="req-h" className="mb-3 text-[15px] font-semibold text-text-0">Requests waiting for you</h2>
            <div className="grid gap-2.5">
              {receivedPending.map((r) => (
                <PersonRow key={r.id} email={otherEmail(r)} viewer={owner}>
                  <div className="flex gap-2">
                    <button
                      onClick={async () => {
                        await acceptConnectionRequest(owner, otherEmail(r))
                        refresh()
                      }}
                      className={`${actionBtn} bg-accent-solid text-white`}
                    >
                      Accept
                    </button>
                    <button
                      onClick={async () => {
                        await removeConnection(owner, otherEmail(r))
                        refresh()
                      }}
                      className={`${actionBtn} border border-border-strong bg-surface text-text-1`}
                    >
                      Decline
                    </button>
                  </div>
                </PersonRow>
              ))}
            </div>
          </section>
        )}

        <section className="mb-8" aria-labelledby="conn-h">
          <h2 id="conn-h" className="mb-3 text-[15px] font-semibold text-text-0">Your connections</h2>
          {accepted.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm leading-relaxed text-text-1">
              <p className="mx-auto max-w-[44ch]">
                No connections yet. Search for someone in your field, open their profile and choose Connect. Requests and acceptances here are real, never suggested contacts.
              </p>
            </div>
          ) : (
            <div className="grid gap-2.5 sm:grid-cols-2">
              {accepted.map((r) => (
                <PersonRow key={r.id} email={otherEmail(r)} viewer={owner} />
              ))}
            </div>
          )}
        </section>

        {suggestions.length > 0 && (
          <section className="mb-8" aria-labelledby="sug-h">
            <h2 id="sug-h" className="text-[15px] font-semibold text-text-0">People you may know</h2>
            <p className="mb-3 text-xs text-text-1">Suggested from mutual connections and your city. Never from popularity.</p>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {suggestions.map((p) => (
                <PersonRow key={p.email} email={p.email} viewer={owner} note={p.mutualEmails.length ? mutualLabel(p.mutualNames) : `Also in ${p.sameCity}`}>
                  <button
                    onClick={async () => {
                      await sendConnectionRequest(owner, p.email)
                      refresh()
                    }}
                    className={`${actionBtn} bg-accent-solid text-white`}
                  >
                    Connect
                  </button>
                </PersonRow>
              ))}
            </div>
          </section>
        )}

        {sentPending.length > 0 && (
          <section aria-labelledby="pend-h">
            <h2 id="pend-h" className="mb-3 text-[15px] font-semibold text-text-0">Waiting for a reply</h2>
            <div className="grid gap-2.5 sm:grid-cols-2">
              {sentPending.map((r) => (
                <PersonRow key={r.id} email={otherEmail(r)}>
                  <span className="rounded-full bg-surface-sunken px-3 py-1 text-xs font-medium text-text-1">Request sent</span>
                </PersonRow>
              ))}
            </div>
          </section>
        )}
      </div>
    </AppShell>
  )
}

function PersonRow({ email, children, viewer, note }: { email: string; children?: ReactNode; viewer?: string; note?: string }) {
  const person = findAccountByEmail(email)
  const username = person && 'username' in person ? person.username : undefined
  const name = person?.legalName ?? email
  const mutual = viewer && !note ? connectionsInCommon(viewer, email).sharedConnections : []
  const sub = note ?? (mutual.length ? `${mutual.length} mutual ${mutual.length === 1 ? 'connection' : 'connections'}` : username ? `@${username}` : '')

  return (
    <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 transition-shadow hover:shadow-md">
      <UserAvatar ownerEmail={email} name={name} size={48} />
      <div className="min-w-0 flex-1 basis-[140px]">
        {username ? (
          <Link to={`/profile/${username}`} className="block truncate text-[15px] font-semibold text-text-0 hover:text-accent">
            {name}
          </Link>
        ) : (
          <span className="block truncate text-[15px] font-semibold text-text-0">{name}</span>
        )}
        {sub && <span className="block truncate text-xs text-text-1">{sub}</span>}
      </div>
      {children}
    </div>
  )
}
