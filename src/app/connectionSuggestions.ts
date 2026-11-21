/**
 * "People you may know" — derived only from the real connection graph and
 * real accounts. A candidate appears only when there is a verifiable reason
 * (mutual connections, or the same city). Never ranked by popularity,
 * follower counts or views (§17.1). Private profiles are never suggested.
 */
import { findAccountByEmail, getAccountVisibility, listAllAccounts } from './demoAccountStore'
import { connectionsInCommon, relationshipState } from './connectionStore'

export interface PersonSuggestion {
  email: string
  name: string
  username?: string
  mutualEmails: string[]
  mutualNames: string[]
  sameCity?: string
}

export function suggestPeopleFor(viewerEmail: string, limit = 6): PersonSuggestion[] {
  const me = viewerEmail.trim().toLowerCase()
  if (!me) return []
  const out: PersonSuggestion[] = []
  for (const a of listAllAccounts()) {
    if (a.accountType !== 'individual') continue
    const email = a.email.trim().toLowerCase()
    if (email === me) continue
    if (getAccountVisibility(email) === 'private') continue
    if (relationshipState(me, email) !== 'none') continue
    const { sharedConnections, sharedContext } = connectionsInCommon(me, email)
    const sameCity = sharedContext.cities?.[0]
    if (sharedConnections.length === 0 && !sameCity) continue
    out.push({
      email,
      name: a.legalName,
      username: 'username' in a ? a.username : undefined,
      mutualEmails: sharedConnections,
      mutualNames: sharedConnections.map((e) => findAccountByEmail(e)?.legalName ?? e),
      sameCity,
    })
  }
  return out
    .sort((x, y) => y.mutualEmails.length - x.mutualEmails.length || Number(!!y.sameCity) - Number(!!x.sameCity) || x.name.localeCompare(y.name))
    .slice(0, limit)
}

export function mutualLabel(names: string[]): string {
  if (names.length === 0) return ''
  if (names.length === 1) return `Connected to ${names[0]}`
  return `${names[0]} and ${names.length - 1} other mutual ${names.length - 1 === 1 ? 'connection' : 'connections'}`
}
