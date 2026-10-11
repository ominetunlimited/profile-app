import { getAccountImages, useAccountsCacheVersion } from '@/app/demoAccountStore'
import { ProfileAvatarFrame, type FrameShape } from './profile/ProfileAvatarFrame'

/**
 * The one avatar component: user → account's uploaded photo → this component →
 * everywhere. Resolved live from the server-side accounts cache; the initial
 * is shown only when the account has no photo.
 *
 * §13 PROFILE frame system — avatars are not forced into a generic circle.
 * `shape` selects circle / squircle / geometric / org, and `verified` adds the
 * restrained verification seal in the corner (a verified identity, never an
 * influencer badge). Defaults preserve the previous circular behaviour so every
 * existing call site is unchanged.
 */
export function UserAvatar({
  ownerEmail,
  name,
  size = 36,
  className = '',
  shape = 'circle',
  verified,
  sealTone = 'green',
}: {
  ownerEmail: string | undefined
  name: string
  size?: number
  className?: string
  shape?: FrameShape
  verified?: boolean
  sealTone?: 'gold' | 'green' | 'blue' | 'royal'
}) {
  useAccountsCacheVersion()
  const avatarUrl = getAccountImages(ownerEmail).avatarUrl

  const initials = name.trim().slice(0, 1).toUpperCase() || '?'

  const inner = avatarUrl ? (
    <img src={avatarUrl} alt="" className="h-full w-full object-cover" />
  ) : (
    <span
      className="flex h-full w-full items-center justify-center bg-accent-solid font-semibold text-profile-off-white"
      style={{ fontSize: Math.max(10, size * 0.4) }}
    >
      {initials}
    </span>
  )

  return (
    <ProfileAvatarFrame shape={shape} size={size} verified={verified} sealTone={sealTone} className={className}>
      {inner}
    </ProfileAvatarFrame>
  )
}
