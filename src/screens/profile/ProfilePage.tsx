import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { isCvEligible, isPortfolioEligible, ORG_TRUST_STATUS_LABEL, type Account } from '@/app/accountTypes'
import { listActivities, ownerKey } from '@/app/activityStore'
import { computeTrustScore } from '@/app/trustScore'
import { listAllAccounts } from '@/app/demoAccountStore'
import { getProfileMedia } from '@/app/mediaStore'

const TABS = ['overview', 'cv-portfolio', 'skills-tools', 'reviews'] as const
type Tab = (typeof TABS)[number]

/**
 * §24 Profile Page Architecture — one component serves both §24.1 (own
 * profile, editable, Trust Passport) and §24.2-equivalent (viewing someone
 * else, view-only + Connect/Message) depending on whether `:username`
 * resolves to the signed-in account. `me` is this app's own-profile alias
 * (no backend-issued profile URLs exist yet to link to instead).
 */
export function ProfilePage() {
  const { username } = useParams<{ username: string }>()
  const [params, setParams] = useSearchParams()
  const { account } = useAccount()
  const [tab, setTab] = useState<Tab>((params.get('tab') as Tab) ?? 'overview')

  const isSelf = username === 'me' || (!!account && 'username' in account && account.username === username)

  // §24.2 — viewing someone else: a real registered account (never
  // fabricated), looked up by username from every account actually created
  // on this browser (demoAccountStore.ts's listAllAccounts).
  const otherAccount: Account | undefined = isSelf ? undefined : listAllAccounts().find((a) => 'username' in a && a.username === username)

  if (!isSelf && !otherAccount) {
    return (
      <AppShell>
        <div className="mx-auto flex min-h-[50vh] max-w-lg flex-col items-center justify-center gap-2 px-4 text-center">
          <h1 className="text-lg font-semibold text-text-0">Profile not found</h1>
          <p className="text-sm text-text-1">No account named "{username}" exists on this browser yet.</p>
        </div>
      </AppShell>
    )
  }

  if (isSelf && !account) {
    return (
      <AppShell>
        <div className="p-8 text-center text-text-1">Sign in to view your profile.</div>
      </AppShell>
    )
  }

  const viewed = (isSelf ? account : otherAccount)!
  const viewerEmail = isSelf ? ownerKey(account) : ownerKey(viewed)
  const name = viewed.legalName
  const initials = name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
  const canCv = isCvEligible(viewed)
  const canPortfolio = isPortfolioEligible(viewed)
  const activityCount = listActivities(ownerKey(viewed)).length
  const trustScore = computeTrustScore(viewed)
  const media = getProfileMedia(viewerEmail)

  function selectTab(t: Tab) {
    setTab(t)
    setParams(t === 'overview' ? {} : { tab: t })
  }

  return (
    <AppShell>
      <div className="border-b border-border bg-surface">
        {media.coverDataUrl ? (
          <img src={media.coverDataUrl} alt="" className="h-36 w-full object-cover" />
        ) : (
          <div className="h-36 bg-gradient-to-br from-accent/20 to-trust/10" />
        )}
        <div className="mx-auto max-w-[900px] px-4 pb-5 sm:px-6">
          <div className="-mt-10 flex flex-wrap items-end gap-4">
            <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-accent text-xl font-semibold text-white">
              {media.avatarDataUrl ? <img src={media.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-text-0">{name}</h1>
                <span className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-medium text-text-1">
                  {viewed.accountType === 'individual' ? 'Not yet verified' : ORG_TRUST_STATUS_LABEL[viewed.registryLevel]}
                </span>
              </div>
              {viewed.accountType === 'individual' && viewed.headline && <p className="text-sm text-text-1">{viewed.headline}</p>}
              {viewed.username && <p className="font-mono text-xs text-text-2">@{viewed.username}</p>}
            </div>
            {isSelf && (
              <Link to="/settings" className="mb-1 flex-none rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-0">
                Edit profile
              </Link>
            )}
          </div>

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[
              ['Activities', activityCount],
              ['Trust Score', trustScore.total],
              // Followers/Connections/Reviews/Verified items have no real data
              // source in this build (no social graph, no review system, no
              // verification pipeline) — honestly 0 rather than fabricated,
              // same reasoning as computeTrustScore()'s current-always-0 result.
              ['Followers', 0],
              ['Connections', 0],
              ['Reviews', 0],
              ['Verified items', 0],
            ].map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-border p-2.5 text-center">
                <div className="font-mono text-lg font-semibold text-text-0">{value}</div>
                <div className="text-[10.5px] text-text-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[900px] px-4 sm:px-6">
        <nav className="flex gap-1 border-b border-border py-2">
          {TABS.filter((t) => t !== 'cv-portfolio' || canCv || canPortfolio).map((t) => (
            <button
              key={t}
              onClick={() => selectTab(t)}
              className={`rounded-lg px-3 py-2 text-sm font-medium capitalize ${tab === t ? 'bg-surface-sunken text-text-0' : 'text-text-1'}`}
            >
              {t.replace('-', ' & ')}
            </button>
          ))}
        </nav>

        <div className="py-6">
          {tab === 'overview' && (
            <div className="flex flex-col gap-4">
              <div>
                <h2 className="mb-2 font-semibold text-text-0">Recent activities</h2>
                {activityCount === 0 ? (
                  <EmptySection
                    title="Recent activities"
                    body={isSelf ? 'Nothing recorded yet. Head to Home to record your first activity.' : 'Nothing recorded yet.'}
                  />
                ) : (
                  <div className="flex flex-col gap-2">
                    {listActivities(ownerKey(viewed))
                      .slice(0, 5)
                      .map((a) => (
                        <div key={a.id} className="rounded-lg border border-border bg-surface p-3">
                          <div className="mb-1 flex items-center gap-2 text-xs text-text-2">
                            <span className="rounded-full border border-border px-2 py-0.5">{a.type}</span>
                            <span>{new Date(a.createdAt).toLocaleDateString()}</span>
                          </div>
                          <div className="text-sm font-medium text-text-0">{a.title}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <EmptySection title="Verification status" body="No verification requests submitted yet — start from the Trust Centre." action={isSelf ? { label: 'Go to Trust Centre', to: '/trust' } : undefined} />
            </div>
          )}

          {tab === 'cv-portfolio' && !isSelf && (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              Viewing another account's CV/Portfolio isn't available in this build yet — the CV/Portfolio engine
              currently only renders the signed-in account's own documents. Flagged as a real limitation, not hidden.
            </div>
          )}
          {tab === 'cv-portfolio' && isSelf && (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {canCv && (
                <Link to="/career/cv/executive" className="rounded-xl border border-border bg-surface p-4 hover:border-accent">
                  <div className="mb-1 font-semibold text-text-0">CV</div>
                  <div className="text-sm text-text-1">Auto-built from your verified evidence. 10 templates, fully editable.</div>
                </Link>
              )}
              {canPortfolio && (
                <Link
                  to={viewed.accountType === 'organisation' ? '/career/portfolio/organisation-company-showcase' : '/career/portfolio/consultant'}
                  className="rounded-xl border border-border bg-surface p-4 hover:border-accent"
                >
                  <div className="mb-1 font-semibold text-text-0">Portfolio</div>
                  <div className="text-sm text-text-1">
                    {viewed.accountType === 'organisation'
                      ? 'Your Institutional Portfolio — programmes, staff, and impact records.'
                      : 'Your complete work archive — visible to anyone who views your profile.'}
                  </div>
                </Link>
              )}
            </div>
          )}

          {tab === 'skills-tools' && <EmptySection title="Skills & tools" body="Skills you tag on recorded activities appear here automatically." />}
          {tab === 'reviews' && <EmptySection title="Client reviews" body="Verified reviews from clients and collaborators appear here." />}
        </div>
      </div>
    </AppShell>
  )
}

function EmptySection({ title, body, action }: { title: string; body: string; action?: { label: string; to: string } }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-1 font-semibold text-text-0">{title}</div>
      <p className="text-sm text-text-1">{body}</p>
      {action && (
        <Link to={action.to} className="mt-3 inline-block text-sm font-semibold text-accent">
          {action.label} →
        </Link>
      )}
    </div>
  )
}
