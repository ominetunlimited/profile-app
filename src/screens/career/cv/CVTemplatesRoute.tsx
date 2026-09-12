import { RequireIndividual } from '@/app/guards'
import { CVTemplatesPage } from './CVTemplatesPage'

/**
 * §49.5 hard rule: this directory never imports anything from
 * `src/screens/career/portfolio/` — the wall is structural, not a
 * conditional render. CV is individual-exclusive (organisations never reach
 * it, structurally); Portfolio is not the mirror-image restriction — it's
 * universal (§15.4), so individuals hold both a CV and a Portfolio at once.
 */
export function CVTemplatesRoute() {
  return (
    <RequireIndividual>
      <CVTemplatesPage />
    </RequireIndividual>
  )
}
