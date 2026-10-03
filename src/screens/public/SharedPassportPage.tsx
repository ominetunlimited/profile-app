import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { openSharedPassport, type SharedPassport } from '@/app/trustPassportShareStore'

/** What someone sees when they open a Trust Passport link. No sign-in needed: the link itself is the permission, it can expire or be revoked, and every open is recorded for the owner. */
export function SharedPassportPage() {
  const { id = '' } = useParams()
  const [passport, setPassport] = useState<SharedPassport | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    openSharedPassport(id).then(setPassport).catch((e: Error) => setError(e.message))
  }, [id])

  return (
    <main className="mx-auto min-h-screen max-w-[640px] px-4 py-10 sm:px-6">
      <div className="mb-1 text-xs font-semibold uppercase tracking-wide text-text-2">PROFILE Trust Passport</div>
      {error ? (
        <div className="mt-4 rounded-xl border border-border bg-surface p-6">
          <h1 className="mb-1 text-lg font-bold text-text-0">This passport can't be opened</h1>
          <p className="text-sm text-text-1">{error} The owner may have revoked it, or it may have expired.</p>
        </div>
      ) : !passport ? (
        <p className="mt-4 text-sm text-text-1">Opening…</p>
      ) : (
        <div className="mt-2 flex flex-col gap-3.5">
          <div className="rounded-xl border border-border bg-surface p-5">
            <h1 className="text-xl font-bold tracking-tight text-text-0">{passport.name}</h1>
            {passport.headline && <p className="text-sm text-text-1">{passport.headline}</p>}
            {passport.country && <p className="text-xs text-text-2">{passport.country}</p>}
            <div className="mt-3 inline-block rounded-full bg-surface-sunken px-2.5 py-1 text-[11px] font-semibold text-text-1">
              {passport.identity_verified ? 'Identity verified' : 'Identity not verified'}
            </div>
          </div>
          <div className="rounded-xl border border-border bg-surface p-5">
            <div className="mb-2.5 text-sm font-semibold text-text-0">Confirmed records</div>
            {passport.confirmed_records.length === 0 ? (
              <p className="text-xs text-text-1">Nothing has been confirmed by an issuer yet.</p>
            ) : (
              passport.confirmed_records.map((r, i) => (
                <div key={i} className="border-b border-border py-2 last:border-0">
                  <div className="text-sm text-text-0">{r.record}</div>
                  <div className="text-[11px] text-text-1">
                    Confirmed by {r.confirmed_by}
                    {r.confirmed_at ? ` · ${new Date(r.confirmed_at).toLocaleDateString()}` : ''}
                  </div>
                </div>
              ))
            )}
            <p className="mt-2 text-[11px] text-text-1">{passport.recorded_activities} recorded activities on the owner's profile.</p>
          </div>
          <p className="text-[11px] text-text-1">
            Shared with {passport.shared_with} on {new Date(passport.shared_at).toLocaleDateString()} ·{' '}
            {passport.expires_at ? `link expires ${new Date(passport.expires_at).toLocaleDateString()}` : 'valid until the owner revokes it'}. This opening was recorded in the owner's access log.
          </p>
        </div>
      )}
    </main>
  )
}
