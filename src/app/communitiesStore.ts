/**
 * §21.2 GROUP_TYPES seed list — these are community *categories*, not
 * fabricated people or fake activity, so they're safe to ship as real,
 * joinable entries (same spirit as the Portfolio Template Library naming).
 * Membership is real, local, and persisted — same temporary-scaffolding
 * caveats as `demoAccountStore.ts`.
 */
export interface CommunitySeed {
  id: string
  name: string
  type: string
  description: string
}

export const COMMUNITY_SEEDS: CommunitySeed[] = [
  { id: 'engineering-guild', name: 'Engineering Guild', type: 'Guild', description: 'Peer verification and craft standards for engineers and fabricators.' },
  { id: 'design-network', name: 'Design Industry Network', type: 'Industry Network', description: 'Product, graphic, and UX designers sharing critique and opportunities.' },
  { id: 'trade-association', name: 'Skilled Trades Association', type: 'Trade Association', description: 'Electricians, carpenters, welders, and allied trades.' },
  { id: 'research-group', name: 'Open Research Group', type: 'Research Group', description: 'Cross-institution research collaboration and case study review.' },
  { id: 'mentorship-circle', name: 'Early Career Mentorship Circle', type: 'Mentorship Circle', description: 'Mentors and mentees matched across professions.' },
]

const STORAGE_KEY = 'profile:demo-community-memberships'

function readMemberships(): Record<string, string[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeMemberships(m: Record<string, string[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(m))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function isMember(ownerEmail: string, communityId: string): boolean {
  return (readMemberships()[ownerEmail] ?? []).includes(communityId)
}

export function toggleMembership(ownerEmail: string, communityId: string): boolean {
  const all = readMemberships()
  const current = all[ownerEmail] ?? []
  const next = current.includes(communityId) ? current.filter((id) => id !== communityId) : [...current, communityId]
  all[ownerEmail] = next
  writeMemberships(all)
  return next.includes(communityId)
}

export function memberCount(communityId: string): number {
  const all = readMemberships()
  return Object.values(all).filter((ids) => ids.includes(communityId)).length
}
