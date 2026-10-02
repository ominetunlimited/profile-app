/**
 * PROFILE recommendation engine.
 *
 *   account type + profile data + skills + experience + goals + activity +
 *   interests + opportunities  →  candidates  →  weighted by account segment
 *   and the viewer's own feedback  →  ranked, diversified, **explained**.
 *
 * Deterministic and transparent by design: every recommendation carries the
 * plain-language `reason` it was produced for and the `signals` behind it, so
 * nothing is a mystery score. Inputs are limited to what the viewer is already
 * permitted to read (their own records, public activity of others, open jobs,
 * public community listings). Country is used only for locality matching.
 * Sensitive personal characteristics are never inputs — this build doesn't
 * even collect any — and people suggestions use only public profile fields and
 * public skills, never private data, and skip anyone the viewer has blocked.
 */
import type { Account } from './accountTypes'
import { hubForOrgType, sectorForOrgType } from './accountTypes'
import { listActivities, ownerKey } from './activityStore'
import { listAllAccounts } from './demoAccountStore'
import { listConnectedEmails, relationshipState } from './connectionStore'
import { listFollowedOrgs } from './followStore'
import { listOpenJobs, orgDisplayName, type JobListing } from './jobStore'
import { listApplicationsFor, listApplicationsForJob } from './applicationStore'
import { listBookmarks } from './socialStore'
import { listCommunities, membershipOf, roleOf, listMembers } from './communityStore'
import { ACADEMY_TOPICS, listEnrollments } from './learningStore'
import { getProfileMedia } from './mediaStore'
import { getCvDetails } from './cvDetailsStore'
import { listVerificationRequests, listRequestsForIssuer } from './verificationRequestStore'
import { listStaffFor } from './orgStaffStore'
import { listSchemas } from './schemaStore'
import { isBlockedByMe } from './messageStore'
import { listFeedback } from './recommendationFeedbackStore'

export type RecKind = 'profile' | 'verification' | 'evidence' | 'skill' | 'opportunity' | 'connection' | 'community' | 'learning' | 'organisation'

export interface Recommendation {
  /** Stable id used for dismiss/acted feedback, e.g. "opportunity:<jobId>". */
  key: string
  kind: RecKind
  title: string
  /** Plain-language "recommended because…" shown to the viewer. */
  reason: string
  /** The concrete signals behind it (shown under "Why am I seeing this?"). */
  signals: string[]
  score: number
  to: string
  cta: string
}

export const KIND_LABEL: Record<RecKind, string> = {
  profile: 'Profile',
  verification: 'Verification',
  evidence: 'Evidence',
  skill: 'Skills',
  opportunity: 'Opportunity',
  connection: 'People',
  community: 'Community',
  learning: 'Learning',
  organisation: 'Organisation',
}

const norm = (s: string) => s.trim().toLowerCase()
const list = (items: string[], max = 3) => items.slice(0, max).join(', ') + (items.length > max ? ` +${items.length - max}` : '')
const DAY = 86400000

// --- Segments: how an account's type/stage changes what matters ---------
type Segment = 'learner' | 'early_career' | 'professional' | 'trades' | 'independent' | 'researcher' | 'org_institution' | 'org_business' | 'org_regulatory' | 'org_community'

function segmentOf(account: Account): Segment {
  if (account.accountType === 'organisation') {
    const hub = hubForOrgType(account.orgType)
    return hub === 'institutional_hub' ? 'org_institution' : hub === 'business_hub' ? 'org_business' : hub === 'regulatory_console' ? 'org_regulatory' : 'org_community'
  }
  const stage = account.careerStage
  if (stage === 'learner' || stage === 'student' || stage === 'undergraduate' || stage === 'technical_vocational_learner') return 'learner'
  if (stage === 'fresh_graduate' || stage === 'job_seeker' || stage === 'intern' || stage === 'emerging_professional' || stage === 'national_service_participant') return 'early_career'
  if (stage === 'apprentice' || stage === 'skilled_tradesperson') return 'trades'
  if (stage === 'freelancer' || stage === 'entrepreneur' || stage === 'consultant') return 'independent'
  if (stage === 'researcher') return 'researcher'
  if (account.pathway === 'competence') return 'trades'
  return 'professional'
}

/** Per-segment emphasis on each kind (1 = neutral). Small, readable nudges. */
const WEIGHTS: Record<Segment, Partial<Record<RecKind, number>>> = {
  learner: { learning: 1.3, community: 1.1, opportunity: 0.9, connection: 1.0, verification: 0.9 },
  early_career: { opportunity: 1.25, learning: 1.15, profile: 1.1, evidence: 1.1 },
  professional: { opportunity: 1.1, connection: 1.15, verification: 1.1, skill: 1.1 },
  trades: { verification: 1.25, community: 1.2, evidence: 1.1, learning: 0.9 },
  independent: { evidence: 1.2, connection: 1.15, community: 1.1, learning: 1.05 },
  researcher: { community: 1.2, evidence: 1.1, connection: 1.1, opportunity: 0.9 },
  org_institution: { organisation: 1.3, verification: 1.1 },
  org_business: { organisation: 1.3, opportunity: 0.8 },
  org_regulatory: { organisation: 1.3 },
  org_community: { organisation: 1.1, community: 1.25, connection: 1.1 },
}

/** Which community types suit which segment. */
const COMMUNITY_AFFINITY: Record<Segment, string[]> = {
  learner: ['Learning Cohort', 'Mentorship Circle'],
  early_career: ['Learning Cohort', 'Mentorship Circle', 'Professional Community'],
  professional: ['Industry Network', 'Professional Community', 'Research Group'],
  trades: ['Guild', 'Trade Association', 'Mentorship Circle'],
  independent: ['Industry Network', 'Professional Community'],
  researcher: ['Research Group', 'Learning Cohort'],
  org_institution: ['Learning Cohort', 'Research Group', 'Mentorship Circle'],
  org_business: ['Industry Network', 'Trade Association', 'Professional Community'],
  org_regulatory: ['Trade Association', 'Professional Community'],
  org_community: ['Guild', 'Trade Association', 'Industry Network', 'Professional Community'],
}

const LEARNING_BY_SEGMENT: Record<Segment, string[]> = {
  learner: ['Building a professional profile', 'CV and cover letter guidance', 'Career planning'],
  early_career: ['CV and cover letter guidance', 'Interview preparation', 'Building a professional profile'],
  professional: ['Personal branding', 'Networking best practices', 'Creating an effective portfolio'],
  trades: ['Trade and artisan branding', 'Building a professional profile', 'Networking best practices'],
  independent: ['Personal branding', 'Business profile optimisation', 'Creating an effective portfolio'],
  researcher: ['Research presentation', 'Creating an effective portfolio', 'Networking best practices'],
  org_institution: [],
  org_business: [],
  org_regulatory: [],
  org_community: [],
}

// --- Signals -------------------------------------------------------------
interface Signals {
  account: Account
  email: string
  segment: Segment
  skills: Map<string, number> // lower-cased skill/tool -> frequency across own activities
  displaySkill: Map<string, string>
  activityCount: number
  connected: Set<string>
  followed: Set<string>
}

function gather(account: Account): Signals {
  const email = ownerKey(account)
  const acts = listActivities(email)
  const skills = new Map<string, number>()
  const displaySkill = new Map<string, string>()
  for (const a of acts) for (const s of [...a.skills, ...a.tools]) {
    const k = norm(s)
    if (!k) continue
    skills.set(k, (skills.get(k) ?? 0) + 1)
    displaySkill.set(k, s.trim())
  }
  return {
    account,
    email,
    segment: segmentOf(account),
    skills,
    displaySkill,
    activityCount: acts.length,
    connected: new Set(listConnectedEmails(email).map(norm)),
    followed: new Set(listFollowedOrgs(email).map(norm)),
  }
}

// --- Generators ----------------------------------------------------------
type Gen = (s: Signals) => Recommendation[]

const individualProfile: Gen = (s) => {
  if (s.account.accountType !== 'individual') return []
  const a = s.account
  const out: Recommendation[] = []
  const cv = getCvDetails(s.email)
  if (!a.headline) out.push({ key: 'profile:headline', kind: 'profile', title: 'Add a professional headline', reason: 'Your headline is the first thing people read — profiles without one are harder to find and trust.', signals: ['No headline on your profile'], score: 88, to: '/settings', cta: 'Add headline' })
  if (!a.username) out.push({ key: 'profile:username', kind: 'profile', title: 'Choose your @username', reason: 'A username gives you a shareable profile link and lets people mention you.', signals: ['No username set'], score: 78, to: '/settings', cta: 'Choose username' })
  if (!getProfileMedia(s.email).avatarDataUrl) out.push({ key: 'profile:photo', kind: 'profile', title: 'Add a profile photo', reason: 'A photo makes your profile recognisable to people you work with.', signals: ['No profile photo'], score: 58, to: '/settings', cta: 'Add photo' })
  if (!cv.summaryStatement) out.push({ key: 'profile:cv-summary', kind: 'profile', title: 'Write your CV summary', reason: 'Your summary leads your CV and is used when you apply with PROFILE.', signals: ['CV summary is empty'], score: 52, to: '/career/cv/executive', cta: 'Write summary' })
  if (cv.education.length === 0 && s.segment !== 'trades') out.push({ key: 'profile:education', kind: 'profile', title: 'Add an education record', reason: 'Education records can be confirmed by the institution, which strengthens your Trust Score.', signals: ['No education on your CV'], score: 48, to: '/career/cv/executive', cta: 'Add education' })
  return out
}

const individualEvidence: Gen = (s) => {
  if (s.account.accountType !== 'individual') return []
  const acts = listActivities(s.email)
  const out: Recommendation[] = []
  if (s.activityCount === 0) {
    out.push({ key: 'evidence:first-activity', kind: 'evidence', title: 'Record your first piece of work', reason: 'Everything on PROFILE is built from recorded work — it powers your CV, portfolio and recommendations.', signals: ['0 activities recorded'], score: 96, to: '/home', cta: 'Record work' })
    return out
  }
  if (acts.every((a) => a.skills.length === 0)) out.push({ key: 'evidence:tag-skills', kind: 'evidence', title: 'Tag skills on your recorded work', reason: 'Skills on your activities are what we match to opportunities and people.', signals: [`${acts.length} activities, none with skills`], score: 74, to: '/home', cta: 'Tag skills' })
  const types = new Set(acts.map((a) => a.type))
  if (acts.length >= 2 && types.size === 1) out.push({ key: 'evidence:variety', kind: 'evidence', title: 'Show a different side of your work', reason: `All your records are "${[...types][0]}". Adding another type (e.g. a Skill Demonstration or Achievement) gives a fuller picture.`, signals: [`${acts.length} activities, all one type`], score: 40, to: '/home', cta: 'Record work' })
  return out
}

const individualVerification: Gen = (s) => {
  if (s.account.accountType !== 'individual') return []
  const requests = listVerificationRequests(s.email)
  const verified = requests.filter((r) => r.status === 'verified').length
  if (requests.length === 0) {
    const competence = s.segment === 'trades'
    return [{
      key: 'verification:first',
      kind: 'verification',
      title: competence ? 'Submit a trade or licence verification' : 'Submit your first verification',
      reason: competence ? 'For competence-based work, a confirmed licence or competence record is what employers and clients look for.' : 'Nothing on your profile has been verified yet — verification is what raises your Trust Score tier.',
      signals: ['0 verification requests submitted', `Pathway: ${s.account.accountType === 'individual' ? s.account.pathway : ''}`],
      score: 84,
      to: '/trust-passport',
      cta: 'Open Trust Centre',
    }]
  }
  if (verified === 0) return [{ key: 'verification:follow-up', kind: 'verification', title: 'Your verification is awaiting confirmation', reason: `You've submitted ${requests.length} request${requests.length === 1 ? '' : 's'} — you can add a supporting document to speed review.`, signals: [`${requests.length} pending, 0 confirmed`], score: 50, to: '/trust-passport', cta: 'View status' }]
  return []
}

const jobScore = (job: JobListing, s: Signals): { score: number; matched: string[] } => {
  const matched = job.requiredSkills.filter((k) => s.skills.has(norm(k)))
  let score = 0
  if (job.requiredSkills.length > 0) score += (matched.length / job.requiredSkills.length) * 55
  if (matched.length > 0) score += Math.min(matched.length, 3) * 6
  if (s.followed.has(norm(job.orgEmail))) score += 18
  const country = s.account.country?.toLowerCase()
  if (country && job.location.toLowerCase().includes(country)) score += 8
  const headline = (s.account.accountType === 'individual' ? s.account.headline ?? '' : '').toLowerCase()
  if (headline && job.title.toLowerCase().split(/\s+/).some((w) => w.length > 3 && headline.includes(w))) score += 14
  return { score, matched }
}

const opportunities: Gen = (s) => {
  if (s.account.accountType !== 'individual') return []
  const applied = new Set(listApplicationsFor(s.email).map((a) => a.jobId))
  const saved = new Set(listBookmarks(s.email).filter((b) => b.type === 'job').map((b) => b.id))
  const out: Recommendation[] = []
  for (const job of listOpenJobs()) {
    if (applied.has(job.id)) continue
    const { score, matched } = jobScore(job, s)
    const isSaved = saved.has(job.id)
    if (score < 18 && !isSaved) continue
    const followed = s.followed.has(norm(job.orgEmail))
    out.push({
      key: `opportunity:${job.id}`,
      kind: 'opportunity',
      title: isSaved ? `Apply to ${job.title}` : job.title,
      reason: isSaved
        ? `You saved this role at ${orgDisplayName(job.orgEmail)} but haven't applied yet.`
        : matched.length > 0
          ? `Matches your skills (${list(matched.map((m) => s.displaySkill.get(norm(m)) ?? m))}).`
          : followed
            ? `New role from ${orgDisplayName(job.orgEmail)}, an organisation you follow.`
            : `Relevant to your profile and location.`,
      signals: [
        ...(matched.length > 0 ? [`Skills in common: ${list(matched)}`] : []),
        ...(followed ? ['You follow this organisation'] : []),
        ...(isSaved ? ['You saved this job'] : []),
        `Posted by ${orgDisplayName(job.orgEmail)}`,
      ],
      score: isSaved ? Math.max(score, 70) : score,
      to: `/job/${job.id}`,
      cta: isSaved ? 'Apply now' : 'View role',
    })
  }
  return out
}

const skillGaps: Gen = (s) => {
  if (s.account.accountType !== 'individual' || s.skills.size === 0) return []
  const demand = new Map<string, { n: number; display: string }>()
  for (const job of listOpenJobs()) {
    const overlaps = job.requiredSkills.some((k) => s.skills.has(norm(k)))
    if (!overlaps) continue // only roles already near the viewer's own skills
    for (const k of job.requiredSkills) {
      if (s.skills.has(norm(k))) continue
      const cur = demand.get(norm(k)) ?? { n: 0, display: k }
      demand.set(norm(k), { n: cur.n + 1, display: cur.display })
    }
  }
  return [...demand.entries()]
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 2)
    .map(([k, v]) => ({
      key: `skill:${k}`,
      kind: 'skill' as const,
      title: `Build evidence in ${v.display}`,
      reason: `${v.n === 1 ? '1 open role that matches' : `${v.n} open roles that match`} your skills also ${v.n === 1 ? 'asks' : 'ask'} for ${v.display}.`,
      signals: [`Required by ${v.n} open role${v.n === 1 ? '' : 's'} near your skills`, `Your skills: ${list([...s.skills.keys()].map((x) => s.displaySkill.get(x) ?? x))}`],
      score: 38 + v.n * 6,
      to: '/home',
      cta: 'Record work',
    }))
}

const people: Gen = (s) => {
  if (s.account.accountType !== 'individual') return []
  const out: Recommendation[] = []
  const mineConn = s.connected
  for (const other of listAllAccounts()) {
    if (other.accountType !== 'individual') continue
    const email = norm(ownerKey(other))
    if (email === s.email.toLowerCase() || mineConn.has(email)) continue
    if (relationshipState(s.email, email) !== 'none' || isBlockedByMe(email)) continue
    const theirs = new Set(listActivities(email).filter((a) => a.visibility === 'public').flatMap((a) => [...a.skills, ...a.tools].map(norm)))
    const shared = [...s.skills.keys()].filter((k) => theirs.has(k))
    const mutual = listConnectedEmails(email).map(norm).filter((e) => mineConn.has(e))
    let score = shared.length * 14 + Math.min(mutual.length, 3) * 15
    if (other.pathway === s.account.pathway) score += 6
    if (other.country && other.country === s.account.country) score += 8
    if (score < 20) continue
    out.push({
      key: `connection:${email}`,
      kind: 'connection',
      title: other.legalName,
      reason: mutual.length > 0 ? `You have ${mutual.length} mutual connection${mutual.length === 1 ? '' : 's'}${shared.length ? ` and both work with ${list(shared.map((k) => s.displaySkill.get(k) ?? k), 2)}` : ''}.` : `You both work with ${list(shared.map((k) => s.displaySkill.get(k) ?? k))}.`,
      signals: [
        ...(mutual.length ? [`${mutual.length} mutual connections`] : []),
        ...(shared.length ? [`Shared skills: ${list(shared)}`] : []),
        ...(other.pathway === s.account.pathway ? ['Same pathway'] : []),
        ...(other.country && other.country === s.account.country ? ['Same country'] : []),
      ],
      score,
      to: other.username ? `/profile/${other.username}` : '/connections',
      cta: 'View profile',
    })
  }
  return out
}

const communities: Gen = (s) => {
  const out: Recommendation[] = []
  const affinity = COMMUNITY_AFFINITY[s.segment]
  const mine = s.email.toLowerCase()
  for (const c of listCommunities()) {
    if (c.status !== 'active' || roleOf(c.id, mine) !== null || membershipOf(c.id, mine)?.status === 'banned') continue
    const text = `${c.name} ${c.description}`.toLowerCase()
    const hits = [...s.skills.keys()].filter((k) => k.length > 2 && text.includes(k))
    const friends = listMembers(c.id).filter((m) => s.connected.has(norm(m.email)))
    let score = 0
    if (affinity.includes(c.type)) score += 26
    score += Math.min(hits.length, 3) * 12
    score += Math.min(friends.length, 3) * 12
    if (c.kind === 'group') score += 3
    if (score < 24) continue
    out.push({
      key: `community:${c.id}`,
      kind: 'community',
      title: c.name,
      reason: friends.length > 0 ? `${friends.length} of your connections ${friends.length === 1 ? 'is' : 'are'} in this ${c.kind}.` : hits.length > 0 ? `Matches your skills (${list(hits.map((k) => s.displaySkill.get(k) ?? k))}).` : `${c.type}s suit your ${s.account.accountType === 'individual' ? 'career stage' : 'organisation type'}.`,
      signals: [`Type: ${c.type}`, ...(friends.length ? [`${friends.length} connections are members`] : []), ...(hits.length ? [`Skill overlap: ${list(hits)}`] : []), `Privacy: ${c.privacy.replace('_', '-')}`],
      score,
      to: `/communities/${c.slug}`,
      cta: c.privacy === 'public' ? 'View & join' : 'View',
    })
  }
  return out
}

const learning: Gen = (s) => {
  const topics = LEARNING_BY_SEGMENT[s.segment]
  if (topics.length === 0) return []
  const enrolled = new Set(listEnrollments(s.email).map((e) => e.topic))
  const stage = s.account.accountType === 'individual' ? (s.account.careerStage ?? '').replace(/_/g, ' ') : ''
  return topics
    .filter((t) => ACADEMY_TOPICS.includes(t) && !enrolled.has(t))
    .map((t, i) => ({
      key: `learning:${t}`,
      kind: 'learning' as const,
      title: t,
      reason: stage ? `Suited to where you are in your career (${stage}).` : 'Suited to your pathway.',
      signals: [stage ? `Career stage: ${stage}` : `Pathway: ${s.account.accountType === 'individual' ? s.account.pathway : ''}`, 'PROFILE Academy topic'],
      score: 46 - i * 6,
      to: '/learn',
      cta: 'Start learning',
    }))
}

// --- Organisation recommendations (per hub / sector) ---------------------
const organisation: Gen = (s) => {
  if (s.account.accountType !== 'organisation') return []
  const a = s.account
  const hub = hubForOrgType(a.orgType)
  const sector = sectorForOrgType(a.orgType)
  const out: Recommendation[] = []
  const verified = a.registryLevel === 'verified'

  if (!verified) out.push({ key: 'org:verify', kind: 'organisation', title: 'Complete your organisation verification', reason: 'Most workspace tools only unlock once your organisation is verified.', signals: [`Registry status: ${a.registryLevel.replace('_', ' ')}`], score: 92, to: '/settings', cta: 'Open settings' })
  if (!a.username) out.push({ key: 'org:handle', kind: 'organisation', title: 'Choose your organisation handle', reason: 'A handle gives people a link to your profile and lets them follow you.', signals: ['No handle set'], score: 76, to: '/settings', cta: 'Choose handle' })
  if (listStaffFor(s.email).length === 0) out.push({ key: 'org:staff', kind: 'organisation', title: 'Invite your team', reason: 'Colleagues with the right role can verify records, manage hiring and run the workspace with you.', signals: ['No staff invited yet'], score: 54, to: hub === 'institutional_hub' ? '/institution/me' : hub === 'regulatory_console' ? '/government/me' : '/settings?tab=organisation', cta: 'Invite staff' })
  if (s.activityCount === 0) out.push({ key: 'org:first-post', kind: 'organisation', title: 'Share your first update', reason: 'Followers see what your organisation posts — it is how you build an audience here.', signals: ['0 activities posted'], score: 58, to: '/home', cta: 'Post an update' })

  if (hub === 'institutional_hub' && verified) {
    const pending = listRequestsForIssuer(a.legalName).filter((r) => r.status !== 'verified' && r.status !== 'rejected').length
    if (pending > 0) out.push({ key: 'org:pending-records', kind: 'organisation', title: `${pending} record${pending === 1 ? '' : 's'} awaiting confirmation`, reason: 'People have submitted records naming your institution — confirming them builds their Trust Score and your standing.', signals: [`${pending} pending submissions`], score: 97, to: '/institution/me', cta: 'Review queue' })
    if (sector === 'university_or_school' && listSchemas(a.officialEmail).filter((x) => x.status === 'published').length === 0) out.push({ key: 'org:schema', kind: 'organisation', title: 'Publish a credential schema', reason: 'A published schema lets graduates request verifiable credentials from you.', signals: ['0 published schemas', `Sector: university / school`], score: 72, to: '/institution/me/schemas', cta: 'Open schemas' })
  }
  if (hub === 'business_hub' && sector === 'company') {
    const jobs = listOpenJobs().filter((j) => j.orgEmail.toLowerCase() === s.email.toLowerCase())
    if (jobs.length === 0) out.push({ key: 'org:first-job', kind: 'organisation', title: 'Post your first job', reason: 'Candidates apply with a verified PROFILE rather than a CV — you only see real, evidenced applicants.', signals: ['0 open jobs'], score: 86, to: '/org/me/recruiter', cta: 'Post a job' })
    const waiting = jobs.reduce((n, j) => n + listApplicationsForJob(j.id).filter((x) => x.status === 'submitted').length, 0)
    if (waiting > 0) out.push({ key: 'org:applicants', kind: 'organisation', title: `${waiting} application${waiting === 1 ? '' : 's'} to review`, reason: 'New applicants are waiting at the start of your pipeline.', signals: [`${waiting} applications in "Applied"`], score: 94, to: '/org/me/recruiter', cta: 'Open pipeline' })
  }
  if (hub === 'regulatory_console' && verified && sector === 'regulatory_body') {
    const pending = listRequestsForIssuer(a.legalName).filter((r) => r.moduleKey === 'professional_licence' && r.status !== 'verified' && r.status !== 'rejected').length
    if (pending > 0) out.push({ key: 'org:licences', kind: 'organisation', title: `${pending} licence confirmation${pending === 1 ? '' : 's'} pending`, reason: 'Professionals are waiting for your authority to confirm their licence.', signals: [`${pending} pending licence requests`], score: 97, to: '/government/me', cta: 'Review licences' })
  }
  if (hub === 'community_hub' && listCommunities().every((c) => c.ownerEmail.toLowerCase() !== s.email.toLowerCase())) {
    out.push({ key: 'org:first-community', kind: 'organisation', title: 'Create a community for your supporters', reason: 'A community or group gives members a place to talk, share announcements and chat.', signals: ['You own no communities yet'], score: 74, to: '/communities', cta: 'Create community' })
  }
  return out
}

const GENERATORS: Gen[] = [individualProfile, individualEvidence, individualVerification, opportunities, skillGaps, people, communities, learning, organisation]

// --- Ranking -------------------------------------------------------------
export function recommend(account: Account | null, limit = 6): Recommendation[] {
  if (!account) return []
  const s = gather(account)
  const feedback = listFeedback()
  const now = Date.now()
  const dismissed = new Set(feedback.filter((f) => f.action === 'dismissed' && now - new Date(f.created_at).getTime() < 30 * DAY).map((f) => f.rec_key))
  const acted = new Set(feedback.filter((f) => f.action === 'acted').map((f) => f.rec_key))
  const dismissedByKind = new Map<string, number>()
  const actedByKind = new Map<string, number>()
  for (const f of feedback) (f.action === 'dismissed' ? dismissedByKind : actedByKind).set(f.kind, ((f.action === 'dismissed' ? dismissedByKind : actedByKind).get(f.kind) ?? 0) + 1)

  const weights = WEIGHTS[s.segment]
  const candidates = GENERATORS.flatMap((g) => g(s))
    .filter((r) => !dismissed.has(r.key) && !acted.has(r.key))
    .map((r) => {
      let w = weights[r.kind] ?? 1
      if ((dismissedByKind.get(r.kind) ?? 0) >= 3) w *= 0.6 // they keep dismissing this kind
      if ((actedByKind.get(r.kind) ?? 0) >= 2) w *= 1.15 // they engage with this kind
      return { ...r, score: r.score * w }
    })
    .sort((a, b) => b.score - a.score)

  // Diversity: no single kind may crowd out the rest.
  const perKind = new Map<RecKind, number>()
  const out: Recommendation[] = []
  for (const r of candidates) {
    const n = perKind.get(r.kind) ?? 0
    if (n >= 3) continue
    perKind.set(r.kind, n + 1)
    out.push(r)
    if (out.length >= limit) break
  }
  return out
}

/** Test/inspection helper: which segment the engine placed this account in. */
export function segmentFor(account: Account): string {
  return segmentOf(account)
}
