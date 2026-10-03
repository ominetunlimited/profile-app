import { Link } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { getCvDetails, useCvDetailsVersion } from '@/app/cvDetailsStore'

/**
 * §10.4 Hamburger Menu's "Credential Hub" — individual accounts only. Reads
 * the same certifications/education records the CV Details Editor writes
 * (cvDetailsStore.ts), so this and the CV stay in sync automatically rather
 * than duplicating a second credentials list. Verification status is
 * honestly empty: no institution-verification pipeline exists yet in this
 * build (real status lives on the Trust Centre once one does).
 */
export function CredentialHub() {
  const { account } = useAccount()
  if (!account || account.accountType !== 'individual') {
    return (
      <AppShell>
        <div className="mx-auto max-w-lg px-4 py-16 text-center text-sm text-text-1">Credential Hub is available to individual accounts.</div>
      </AppShell>
    )
  }
  useCvDetailsVersion()
  const details = getCvDetails(ownerKey(account))

  return (
    <AppShell>
      <div className="mx-auto max-w-[760px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Credential Hub</h1>
        <p className="mb-6 text-sm text-text-1">Your certifications and education records in one place — the same ones your CV pulls from.</p>

        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-text-0">Certifications</h2>
            <Link to="/career/cv/executive" className="text-xs font-semibold text-accent">Manage in CV Details →</Link>
          </div>
          {details.certifications.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              No certifications added yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {details.certifications.map((c) => (
                <div key={c.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <span className="font-semibold text-text-0">{c.name}</span> — {c.issuer} · {c.year}
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="mb-6">
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-text-0">Education</h2>
            <Link to="/career/cv/executive" className="text-xs font-semibold text-accent">Manage in CV Details →</Link>
          </div>
          {details.education.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              No education records added yet.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {details.education.map((e) => (
                <div key={e.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                  <span className="font-semibold text-text-0">{e.degree}</span> — {e.school} · {e.graduationYear}
                </div>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-2 font-semibold text-text-0">Verification status</h2>
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
            Nothing has been institutionally verified yet.{' '}
            <Link to="/trust" className="font-semibold text-accent">Start a verification from the Trust Centre →</Link>
          </div>
        </section>
      </div>
    </AppShell>
  )
}
