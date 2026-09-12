import { useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { useAccount } from '@/app/AccountContext'
import { isCvEligible, isPortfolioEligible, ORG_TRUST_STATUS_LABEL, type Account } from '@/app/accountTypes'
import { listActivities, ownerKey, type ActivityRecord } from '@/app/activityStore'
import { myRequestFor, pendingRequestsForOwner, requestSelfTag, respondToSelfTag } from '@/app/selfTagStore'
import { computeTrustScore } from '@/app/trustScore'
import { findAccountByUsername } from '@/app/demoAccountStore'
import { getProfileMedia } from '@/app/mediaStore'
import { buildCvData } from '@/app/careerData'
import { publicDisplayName } from '@/app/privacyModeStore'
import { buildPortfolioData } from '@/app/portfolioData'
import { CV_TEMPLATES } from '@/screens/career/cv/cvTemplates'
import { PORTFOLIO_TEMPLATES } from '@/screens/career/portfolio/portfolioTemplates'
import { createRequest, findRequest, listRequestsForOwner, respondToRequest } from '@/app/cvRequestStore'

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
  const otherAccount: Account | undefined = isSelf ? undefined : findAccountByUsername(username)

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
  // §9.7 Private Professional Mode — never show a non-owner the legal name
  // when the account holder has set it private; falls back to the legal
  // name itself when public (the default) or when no alias was ever set.
  const name = publicDisplayName(ownerKey(viewed), viewed.legalName, viewed.accountType === 'individual' ? viewed.preferredDisplayName : undefined, isSelf)
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
              {/* §9.4 Name Collision Resolution — never display a bare name; always
                  alongside headline/country/trustStatus/username together. */}
              <p className="font-mono text-xs text-text-2">
                {viewed.country}
                {viewed.username ? ` · @${viewed.username}` : ''}
              </p>
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
                        <ActivityRow key={a.id} activity={a} isSelf={isSelf} viewerAccount={account} targetEmail={ownerKey(viewed)} />
                      ))}
                  </div>
                )}
              </div>
              {isSelf && <SelfTagRequestsPanel ownerEmail={ownerKey(viewed)} />}
              <EmptySection title="Verification status" body="No verification requests submitted yet — start from the Trust Centre." action={isSelf ? { label: 'Go to Trust Centre', to: '/trust-passport' } : undefined} />
            </div>
          )}

          {tab === 'cv-portfolio' && (
            <CvPortfolioTab viewed={viewed} isSelf={isSelf} viewerAccount={account} canCv={canCv} canPortfolio={canPortfolio} />
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

/**
 * Explicit product direction: Portfolio is the public-facing document —
 * anyone viewing a profile sees it directly, real content, not a link out
 * to the owner's own editor route (which is tied to whoever is currently
 * signed in, not the profile being viewed — reusing it here would have
 * silently rendered the VIEWER's own portfolio on someone else's page).
 * CV stays private by default; a non-owner sees a real request/approval
 * flow (cvRequestStore.ts) instead of the document itself, and a job
 * Application (§4.9) still carries its own CV snapshot independently of
 * this — requesting access here is for an interested viewer, not a
 * completed application.
 */
function CvPortfolioTab({
  viewed,
  isSelf,
  viewerAccount,
  canCv,
  canPortfolio,
}: {
  viewed: Account
  isSelf: boolean
  viewerAccount: Account | null
  canCv: boolean
  canPortfolio: boolean
}) {
  const [, forceRefresh] = useState(0)
  const viewerEmail = viewerAccount ? ownerKey(viewerAccount) : ''
  const targetEmail = ownerKey(viewed)
  const isOrgViewer = viewerAccount?.accountType === 'organisation'

  const portfolioTemplateId = viewed.accountType === 'organisation' ? 'organisation-company-showcase' : 'consultant'
  const PortfolioComponent = PORTFOLIO_TEMPLATES.find((t) => t.id === portfolioTemplateId)?.Component
  const CvComponent = CV_TEMPLATES[0].Component

  const myRequest = !isSelf && viewerEmail ? findRequest(viewerEmail, targetEmail) : null
  const pendingRequests = isSelf ? listRequestsForOwner(targetEmail).filter((r) => r.status === 'pending') : []

  return (
    <div className="flex flex-col gap-8">
      {canPortfolio && PortfolioComponent && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-text-0">Portfolio</h2>
            {isSelf && (
              <Link to={`/career/portfolio/${portfolioTemplateId}`} className="text-xs font-semibold text-accent">
                Edit / change template →
              </Link>
            )}
          </div>
          <div className="overflow-hidden rounded-xl bg-surface-sunken p-4">
            <PortfolioComponent pf={buildPortfolioData(viewed)} />
          </div>
        </section>
      )}

      {canCv && (
        <section>
          <div className="mb-2 flex items-center justify-between">
            <h2 className="font-semibold text-text-0">CV</h2>
            {isSelf && (
              <Link to="/career/cv/executive" className="text-xs font-semibold text-accent">
                Edit / change template →
              </Link>
            )}
          </div>

          {isSelf ? (
            <>
              <div className="mb-4 overflow-hidden rounded-xl bg-surface-sunken p-4">
                <CvComponent cv={buildCvData(viewed)} />
              </div>
              <div className="rounded-xl border border-border bg-surface p-4">
                <h3 className="mb-2 text-sm font-semibold text-text-0">CV requests</h3>
                {pendingRequests.length === 0 ? (
                  <p className="text-xs text-text-1">No pending requests. Your CV stays private until you approve one.</p>
                ) : (
                  <div className="flex flex-col gap-2">
                    {pendingRequests.map((r) => (
                      <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                        <span className="text-text-0">{r.requesterName}</span>
                        <span className="flex gap-2">
                          <button
                            onClick={() => {
                              respondToRequest(r.id, 'approved')
                              forceRefresh((n) => n + 1)
                            }}
                            className="text-xs font-semibold text-success"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => {
                              respondToRequest(r.id, 'denied')
                              forceRefresh((n) => n + 1)
                            }}
                            className="text-xs font-semibold text-danger"
                          >
                            Deny
                          </button>
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : myRequest?.status === 'approved' ? (
            <div className="overflow-hidden rounded-xl bg-surface-sunken p-4">
              <CvComponent cv={buildCvData(viewed)} />
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">
              {myRequest?.status === 'pending' && 'CV request sent — waiting for a response.'}
              {myRequest?.status === 'denied' && 'This CV request was declined.'}
              {!myRequest && (
                <>
                  <p className="mb-3">
                    {name(viewed)}'s CV is private.{isOrgViewer ? ' If their Portfolio impressed you, request access to their CV.' : ' Request access to view it.'}
                  </p>
                  <button
                    disabled={!viewerAccount}
                    onClick={() => {
                      if (!viewerAccount) return
                      createRequest({
                        requesterEmail: viewerEmail,
                        requesterName: viewerAccount.legalName,
                        targetEmail,
                        targetUsername: viewed.username ?? '',
                      })
                      forceRefresh((n) => n + 1)
                    }}
                    className="rounded-lg bg-accent px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
                  >
                    Request CV
                  </button>
                </>
              )}
            </div>
          )}
        </section>
      )}
    </div>
  )
}

function name(account: Account): string {
  return account.legalName
}

/** §11.1's `<SelfTagButton />` / §11.3 Self-Tag System — real, per-activity.
 * "Tag Me" only makes sense on someone else's activity. */
function ActivityRow({
  activity,
  isSelf,
  viewerAccount,
  targetEmail,
}: {
  activity: ActivityRecord
  isSelf: boolean
  viewerAccount: Account | null
  targetEmail: string
}) {
  const [, refresh] = useState(0)
  const viewerEmail = viewerAccount ? ownerKey(viewerAccount) : ''
  const existing = !isSelf && viewerEmail ? myRequestFor(viewerEmail, activity.id) : undefined
  const [role, setRole] = useState('')
  const [showRoleInput, setShowRoleInput] = useState(false)

  return (
    <div className="rounded-lg border border-border bg-surface p-3">
      <div className="mb-1 flex items-center gap-2 text-xs text-text-2">
        <span className="rounded-full border border-border px-2 py-0.5">{activity.type}</span>
        <span>{new Date(activity.createdAt).toLocaleDateString()}</span>
      </div>
      <div className="mb-1 text-sm font-medium text-text-0">{activity.title}</div>
      {!isSelf && viewerAccount && (
        <div className="mt-1.5">
          {existing ? (
            <span className="text-xs text-text-2">
              {existing.status === 'requested' && 'Tag request sent — waiting for approval.'}
              {existing.status === 'approved' && '✓ Tag approved'}
              {existing.status === 'rejected' && 'Tag request declined'}
            </span>
          ) : showRoleInput ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <input
                value={role}
                onChange={(e) => setRole(e.target.value)}
                placeholder="Your role in this"
                className="min-h-[30px] rounded-md border border-border-strong bg-surface px-2 text-xs"
              />
              <button
                onClick={() => {
                  requestSelfTag({
                    requesterEmail: viewerEmail,
                    requesterName: viewerAccount.legalName,
                    activityId: activity.id,
                    activityOwnerEmail: targetEmail,
                    activityTitle: activity.title,
                    role: role || 'Collaborator',
                  })
                  refresh((n) => n + 1)
                }}
                className="text-xs font-semibold text-accent"
              >
                Send
              </button>
            </div>
          ) : (
            <button onClick={() => setShowRoleInput(true)} className="text-xs font-semibold text-accent">
              + Tag Me
            </button>
          )}
        </div>
      )}
    </div>
  )
}

function SelfTagRequestsPanel({ ownerEmail }: { ownerEmail: string }) {
  const [pending, setPending] = useState(() => pendingRequestsForOwner(ownerEmail))
  if (pending.length === 0) return null
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h3 className="mb-2 text-sm font-semibold text-text-0">Tag requests</h3>
      <div className="flex flex-col gap-2">
        {pending.map((r) => (
          <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
            <span className="text-text-0">
              {r.requesterName} wants to be tagged as "{r.role}" on "{r.activityTitle}"
            </span>
            <span className="flex flex-none gap-2">
              <button
                onClick={() => {
                  respondToSelfTag(r.id, 'approved')
                  setPending(pendingRequestsForOwner(ownerEmail))
                }}
                className="text-xs font-semibold text-success"
              >
                Approve
              </button>
              <button
                onClick={() => {
                  respondToSelfTag(r.id, 'rejected')
                  setPending(pendingRequestsForOwner(ownerEmail))
                }}
                className="text-xs font-semibold text-danger"
              >
                Reject
              </button>
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
