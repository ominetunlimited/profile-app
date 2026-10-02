import { useEffect, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { AppShell } from '@/shared/ui/AppShell'
import { ActivityCard } from '@/shared/ui/ActivityCard'
import { RepostCard } from '@/shared/ui/RepostCard'
import { listRepostsBy, useSocialCacheVersion } from '@/app/socialStore'
import { useAccount } from '@/app/AccountContext'
import { isCvEligible, isPortfolioEligible, ORG_TRUST_STATUS_LABEL, type Account } from '@/app/accountTypes'
import { listActivities, ownerKey, useActivitiesCacheVersion } from '@/app/activityStore'
import { pendingRequestsForOwner, respondToSelfTag } from '@/app/selfTagStore'
import { computeTrustScore } from '@/app/trustScore'
import { findAccountByEmail, findAccountByUsername, useAccountsCacheVersion } from '@/app/demoAccountStore'
import { getProfileMedia } from '@/app/mediaStore'
import { buildCvData } from '@/app/careerData'
import { publicDisplayName } from '@/app/privacyModeStore'
import { buildPortfolioData } from '@/app/portfolioData'
import { CV_TEMPLATES } from '@/screens/career/cv/cvTemplates'
import { PORTFOLIO_TEMPLATES } from '@/screens/career/portfolio/portfolioTemplates'
import { createRequest, findRequest, listRequestsForOwner, respondToRequest } from '@/app/cvRequestStore'
import { computeEarnedBadges, BADGE_CATALOGUE } from '@/app/badgeStore'
import { TrustScoreRing } from '@/shared/ui/TrustScoreRing'
import { followOrg, followerCount, isFollowing, unfollowOrg, useFollowsCacheVersion } from '@/app/followStore'
import { acceptConnectionRequest, connectionCount, connectionsInCommon, relationshipState, sendConnectionRequest, useConnectionsCacheVersion, type RelationshipState } from '@/app/connectionStore'
import { getMentorshipPreference, menteeRequestState, sendMenteeRequest } from '@/app/mentorshipStore'

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

  // Pipeline repair Phase A: the accounts cache backing findAccountByUsername
  // loads asynchronously (and can receive a Realtime push) — without
  // depending on this, a profile visited before the initial fetch resolves
  // would render "not found" once and never recheck, since nothing else on
  // this page would force a re-render afterward.
  useAccountsCacheVersion()
  useActivitiesCacheVersion()
  useFollowsCacheVersion()
  useConnectionsCacheVersion()

  // §24.2 — viewing someone else: a real registered account (never
  // fabricated), looked up by username from every account actually
  // registered (demoAccountStore.ts's listAllAccounts, now cross-device).
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
  const targetKey = ownerKey(viewed)
  // §27 Profile Privacy: a visitor only ever sees `public` activity, plus
  // `connections_only` once actually connected — never client-side-hidden
  // after the fact, filtered at the one place every reader of this list goes
  // through.
  const activities = listActivities(targetKey).filter((a) => {
    if (isSelf) return true
    if (a.visibility === 'private') return false
    if (a.visibility === 'connections_only') return relationshipState(ownerKey(account), targetKey) === 'connected'
    return true
  })
  const activityCount = activities.length
  useSocialCacheVersion()
  // Reposts live on the reposter's profile too (RLS already hides private /
  // connections-only reposts from people who shouldn't see them).
  const profileReposts = listRepostsBy(targetKey).filter((r) => isSelf || r.visibility !== 'private')
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
            <div className="flex h-20 w-20 flex-none items-center justify-center overflow-hidden rounded-full border-4 border-surface bg-accent-solid text-xl font-semibold text-white">
              {media.avatarDataUrl ? <img src={media.avatarDataUrl} alt="" className="h-full w-full object-cover" /> : initials}
            </div>
            <div className="min-w-0 flex-1 pb-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold text-text-0">{name}</h1>
                <span className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-medium text-text-1">
                  {viewed.accountType === 'individual' ? 'Not yet verified' : ORG_TRUST_STATUS_LABEL[viewed.registryLevel]}
                </span>
                {/* §24.1 <PathwayBadge type="academic | competency" /> */}
                {viewed.accountType === 'individual' && (
                  <span className="rounded-full border border-trust px-2 py-0.5 text-[11px] font-medium capitalize text-trust">{viewed.pathway}</span>
                )}
                {/* §24.2 <OrgType /> — real, from accountTypes.ts's own OrganisationType, no new field. */}
                {viewed.accountType === 'organisation' && (
                  <span className="rounded-full border border-border-strong px-2 py-0.5 text-[11px] font-medium capitalize text-text-1">
                    {viewed.orgType.replace(/_/g, ' ')}
                  </span>
                )}
              </div>
              {viewed.accountType === 'individual' && viewed.headline && <p className="text-sm text-text-1">{viewed.headline}</p>}
              {/* §9.4 Name Collision Resolution — never display a bare name; always
                  alongside headline/country/trustStatus/username together. */}
              <p className="font-mono text-xs text-text-2">
                {viewed.country}
                {viewed.username ? ` · @${viewed.username}` : ''}
              </p>
            </div>
            {/* §24.1 <TrustScoreRing /> in the header, compact */}
            <TrustScoreRing trust={trustScore} size={56} />
            {isSelf ? (
              <Link to="/settings" className="mb-1 flex-none rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-0">
                Edit profile
              </Link>
            ) : (
              account && (
                <div className="mb-1 flex flex-none gap-2">
                  {/* §24.1 ActionButtons names 'Connect' for individuals; §4.2's
                      org-notification table names 'Org Follow' for organisations —
                      two different relationship models, not one generic button. */}
                  {viewed.accountType === 'organisation' ? (
                    <FollowButton viewerEmail={ownerKey(account)} orgEmail={targetKey} />
                  ) : (
                    <ConnectButton viewerEmail={ownerKey(account)} otherEmail={targetKey} />
                  )}
                  {viewed.accountType === 'individual' && getMentorshipPreference(targetKey).openToMentoring && (
                    <MenteeRequestButton menteeEmail={ownerKey(account)} mentorEmail={targetKey} />
                  )}
                  <Link to={`/messages?with=${encodeURIComponent(targetKey)}`} className="rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-0">
                    Message
                  </Link>
                </div>
              )
            )}
          </div>

          {/* §24.1 <BadgesRow badges={user.badges} /> — real, computed (badgeStore.ts);
              never rendered for organisations, which have no personal badge concept. */}
          {viewed.accountType === 'individual' && <BadgesRow ownerAccount={viewed} />}

          <div className="mt-5 grid grid-cols-3 gap-3 sm:grid-cols-6">
            {(
              viewed.accountType === 'organisation'
                ? [
                    // §24.2 OrgProfilePage's <Stats> — Followers · Verified Staff ·
                    // Projects Posted · Verified Programmes, not the individual
                    // set. No real social graph, staff-verification pipeline, job
                    // board, or programme registry exists yet in this build, so
                    // each is honestly 0 rather than reusing individual-shaped
                    // numbers (Connections/Reviews) that don't apply to an org.
                    ['Followers', followerCount(targetKey)],
                    ['Verified Staff', 0],
                    ['Projects Posted', 0],
                    ['Verified Programmes', 0],
                  ]
                : [
                    ['Activities', activityCount],
                    ['Trust Score', trustScore.total],
                    // Individuals have no follow concept in this build (§4.2's
                    // notification table only names Org Follow) — honestly 0, real
                    // once one exists. Connections is real (connectionStore.ts).
                    // Reviews/Verified items have no review system/verification
                    // pipeline yet — honestly 0 rather than fabricated, same
                    // reasoning as computeTrustScore()'s current-always-0 result.
                    ['Followers', 0],
                    ['Connections', connectionCount(targetKey)],
                    ['Reviews', 0],
                    ['Verified items', 0],
                  ]
            ).map(([label, value]) => (
              <div key={label as string} className="rounded-lg border border-border p-2.5 text-center">
                <div className="font-mono text-lg font-semibold text-text-0">{value}</div>
                <div className="text-[10.5px] text-text-1">{label}</div>
              </div>
            ))}
          </div>

          {/* V9 Unified Ecosystem Patch §12 "Connections-in-Common" — real
              mutual connections and shared city, surfaced on a profile visit. */}
          {!isSelf && account && viewed.accountType === 'individual' && <InCommonRow viewerEmail={ownerKey(account)} subjectEmail={targetKey} />}
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
                    {activities.slice(0, 5).map((a) => (
                      <ActivityCard key={a.id} activity={a} viewerAccount={account} viewerEmail={ownerKey(account)} />
                    ))}
                  </div>
                )}
              </div>
              {profileReposts.length > 0 && (
                <div>
                  <h2 className="mb-2 font-semibold text-text-0">Reposts</h2>
                  <div className="flex flex-col gap-2">
                    {profileReposts.slice(0, 5).map((r) => (
                      <RepostCard key={r.id} repost={r} viewerAccount={account} viewerEmail={ownerKey(account)} />
                    ))}
                  </div>
                </div>
              )}
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
                    className="rounded-lg bg-accent-solid px-4 py-2 text-xs font-semibold text-white disabled:opacity-40"
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

/**
 * §14 Professional Badge System's `<BadgesRow />`. Shows only earned badges
 * — the other ~13 of 16 are never rendered "locked" here (that pattern
 * belongs to a gamified progress UI this section doesn't ask for); a badge
 * either has real evidence behind it or it doesn't appear yet.
 */
function BadgesRow({ ownerAccount }: { ownerAccount: Account }) {
  const earned = computeEarnedBadges(ownerAccount)
  if (earned.length === 0) return null
  return (
    <div className="mt-3 flex flex-wrap gap-1.5">
      {earned.map((type) => {
        const def = BADGE_CATALOGUE.find((b) => b.type === type)!
        return (
          <span
            key={type}
            title={def.selfEvidenced ? 'Self-reported evidence, not institutionally verified' : 'Institutionally verified'}
            className={`rounded-full border px-2.5 py-1 text-[11px] font-semibold ${def.selfEvidenced ? 'border-border-strong text-text-1' : 'border-success text-success'}`}
          >
            {def.selfEvidenced ? '◇' : '✓'} {def.name}
          </span>
        )
      })}
    </div>
  )
}

/** §4.2's org-notification table 'Org Follow' — one-way, no approval. */
function FollowButton({ viewerEmail, orgEmail }: { viewerEmail: string; orgEmail: string }) {
  // Pipeline repair Phase A: the follows cache loads asynchronously — this
  // keeps the button's state in sync once it does, instead of freezing on
  // whatever it read at first render.
  const cacheVersion = useFollowsCacheVersion()
  const [following, setFollowing] = useState(() => isFollowing(viewerEmail, orgEmail))
  useEffect(() => setFollowing(isFollowing(viewerEmail, orgEmail)), [cacheVersion, viewerEmail, orgEmail])
  return (
    <button
      onClick={async () => {
        if (following) await unfollowOrg(viewerEmail, orgEmail)
        else await followOrg(viewerEmail, orgEmail)
        setFollowing(isFollowing(viewerEmail, orgEmail))
      }}
      className={`rounded-lg px-3 py-2 text-xs font-semibold ${following ? 'border border-border-strong text-text-0' : 'bg-accent-solid text-white'}`}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  )
}

/** §24.1 ActionButtons 'Connect' — a real request/accept relationship
 * (connectionStore.ts), distinct from Follow above. */
function ConnectButton({ viewerEmail, otherEmail }: { viewerEmail: string; otherEmail: string }) {
  // Pipeline repair Phase A: the connections cache loads asynchronously —
  // this keeps the button's state in sync once it does.
  const cacheVersion = useConnectionsCacheVersion()
  const [state, setState] = useState<RelationshipState>(() => relationshipState(viewerEmail, otherEmail))
  useEffect(() => setState(relationshipState(viewerEmail, otherEmail)), [cacheVersion, viewerEmail, otherEmail])

  if (state === 'connected') {
    return <span className="rounded-lg border border-success px-3 py-2 text-xs font-semibold text-success">✓ Connected</span>
  }
  if (state === 'pending_sent') {
    return <span className="rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-1">Pending</span>
  }
  if (state === 'pending_received') {
    return (
      <button
        onClick={async () => {
          await acceptConnectionRequest(viewerEmail, otherEmail)
          setState(relationshipState(viewerEmail, otherEmail))
        }}
        className="rounded-lg bg-accent-solid px-3 py-2 text-xs font-semibold text-white"
      >
        Accept request
      </button>
    )
  }
  return (
    <button
      onClick={async () => {
        await sendConnectionRequest(viewerEmail, otherEmail)
        setState(relationshipState(viewerEmail, otherEmail))
      }}
      className="rounded-lg bg-accent-solid px-3 py-2 text-xs font-semibold text-white"
    >
      Connect
    </button>
  )
}

/** §5 Mentee Request — deliberately a distinct request type and store from
 * ConnectButton's Connection Request above, per the patch's explicit "do
 * not merge them into one request type" instruction. Only rendered on an
 * individual profile whose "Open to mentoring" setting is on. */
function MenteeRequestButton({ menteeEmail, mentorEmail }: { menteeEmail: string; mentorEmail: string }) {
  const [state, setState] = useState(() => menteeRequestState(menteeEmail, mentorEmail))

  if (state?.status === 'accepted') {
    return <span className="rounded-lg border border-success px-3 py-2 text-xs font-semibold text-success">✓ Mentor</span>
  }
  if (state) {
    return <span className="rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-1">Mentorship {state.status}</span>
  }
  return (
    <button
      onClick={() => {
        sendMenteeRequest(menteeEmail, mentorEmail, 'I would like to request your mentorship.')
        setState(menteeRequestState(menteeEmail, mentorEmail))
      }}
      className="rounded-lg border border-accent px-3 py-2 text-xs font-semibold text-accent"
    >
      Request mentorship
    </button>
  )
}

/** §12 Connections-in-Common — real mutual connections + shared city, or
 * nothing rendered at all when there's genuinely none to show (never a
 * padded-out "0 in common" line). */
function InCommonRow({ viewerEmail, subjectEmail }: { viewerEmail: string; subjectEmail: string }) {
  const { sharedConnections, sharedContext } = connectionsInCommon(viewerEmail, subjectEmail)
  if (sharedConnections.length === 0 && !sharedContext.cities?.length) return null

  const names = sharedConnections.map((email) => findAccountByEmail(email)?.legalName ?? email)

  return (
    <div className="mt-3 rounded-lg border border-border bg-surface-sunken px-3 py-2 text-xs text-text-1">
      {sharedConnections.length > 0 && (
        <p>
          <span className="font-semibold text-text-0">
            {sharedConnections.length} connection{sharedConnections.length === 1 ? '' : 's'} in common
          </span>
          : {names.slice(0, 3).join(', ')}
          {names.length > 3 ? `, +${names.length - 3} more` : ''}
        </p>
      )}
      {sharedContext.cities?.length ? <p>Also based in {sharedContext.cities[0]}.</p> : null}
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
