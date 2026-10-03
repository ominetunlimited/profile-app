import { getAccountImages, useAccountsCacheVersion } from '@/app/demoAccountStore'

/**
 * The one avatar component: user → account's uploaded photo → this component →
 * everywhere. Resolved live from the server-side accounts cache; the initial
 * is shown only when the account has no photo.
 */
export function UserAvatar({
  ownerEmail,
  name,
  size = 36,
  className = '',
}: {
  ownerEmail: string | undefined
  name: string
  size?: number
  className?: string
}) {
  useAccountsCacheVersion()
  const avatarUrl = getAccountImages(ownerEmail).avatarUrl

  const initials = name.trim().slice(0, 1).toUpperCase() || '?'

  return (
    <span
      className={`flex flex-none items-center justify-center overflow-hidden rounded-full bg-accent-solid font-semibold text-white ${className}`}
      style={{ height: size, width: size, fontSize: Math.max(10, size * 0.4) }}
    >
      {avatarUrl ? <img src={avatarUrl} alt="" className="h-full w-full object-cover" /> : initials}
    </span>
  )
}
