import { RequireAuthenticated } from '@/app/guards'
import { PortfolioTemplatesPage } from './PortfolioTemplatesPage'

/**
 * §49.5's structural wall is one-directional: this directory never imports
 * anything from `src/screens/career/cv/`, and organisations never reach the
 * CV renderer at all. But Portfolio itself is universal (§15.4's mandatory-
 * visible hard rule, §47.6's template library — 9 of 10 templates are
 * individual professions), so both account types reach this route; only the
 * CV route is individual-exclusive.
 */
export function PortfolioTemplatesRoute() {
  return (
    <RequireAuthenticated>
      <PortfolioTemplatesPage />
    </RequireAuthenticated>
  )
}
