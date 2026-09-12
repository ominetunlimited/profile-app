import { ComingSoonPage } from './ComingSoonPage'

export function DeveloperPlatform() {
  return (
    <ComingSoonPage
      title="Developer Platform"
      description="Build on PROFILE's verification and trust infrastructure. Not yet available in this build."
      planned={['OAuth-based app registration', 'Webhooks for verification events', 'Sandbox environment', 'Partner review process']}
    />
  )
}
