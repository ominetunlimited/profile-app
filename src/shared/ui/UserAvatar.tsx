import { useEffect, useState } from 'react'
import { getProfileMedia } from '@/app/mediaStore'

/**
 * Pipeline repair S4 — the author's photo showed only on their own Profile
 * page, never on their activity cards, comments, reposts, or anywhere else
 * their name appears. Root cause: every other surface either rendered bare
 * initials (ActivityCard) or never existed as a shared component at all, so
 * each screen re-derived its own avatar markup instead of resolving the
 * account's real photo. This resolves it fresh from the account's own media
 * record every render — never a snapshot taken at write time — so a later
 * photo change is reflected everywhere without touching stored records, and
 * so this same component keeps working unchanged once accounts live in a
 * real backend instead of localStorage (only the data source under
 * `getProfileMedia` changes then, not this component).
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
  const [avatarUrl, setAvatarUrl] = useState(() => (ownerEmail ? getProfileMedia(ownerEmail).avatarDataUrl : null))

  useEffect(() => {
    function refresh() {
      setAvatarUrl(ownerEmail ? getProfileMedia(ownerEmail).avatarDataUrl : null)
    }
    refresh()
    window.addEventListener('profile-media-changed', refresh)
    return () => window.removeEventListener('profile-media-changed', refresh)
  }, [ownerEmail])

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
