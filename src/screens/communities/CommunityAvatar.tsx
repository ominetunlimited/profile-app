import { useEffect, useState } from 'react'
import { getCommunityImageUrl, type Community } from '@/app/communityStore'

export function useCommunityImage(path: string | null): string | null {
  const [url, setUrl] = useState<string | null>(null)
  useEffect(() => {
    let live = true
    setUrl(null)
    if (path) void getCommunityImageUrl(path).then((u) => live && setUrl(u))
    return () => {
      live = false
    }
  }, [path])
  return url
}

export function CommunityAvatar({ community, size = 40 }: { community: Community; size?: number }) {
  const url = useCommunityImage(community.avatarPath)
  return url ? (
    <img src={url} alt="" width={size} height={size} loading="lazy" className="flex-none rounded-xl object-cover" style={{ width: size, height: size }} />
  ) : (
    <span className="flex flex-none items-center justify-center rounded-xl bg-accent-solid font-semibold text-white" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {community.name.slice(0, 1).toUpperCase()}
    </span>
  )
}
