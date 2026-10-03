import { ComingSoonPage } from './ComingSoonPage'

export function ApiCentre() {
  return (
    <ComingSoonPage
      title="API Centre"
      description="Programmatic access to your PROFILE data — CV, Portfolio, Trust Score, verification status. Coming soon."
      planned={['REST API keys', 'Rate limits & usage dashboard', 'API reference documentation', 'Verified-employer data-sharing endpoints']}
    />
  )
}
