/**
 * PROFILE AVATAR / PHOTOGRAPH FRAME SYSTEM (§13).
 *
 * Not every avatar goes in a generic circle. Four restrained frame shapes, all
 * built from the PROFILE geometry, plus an optional verified treatment that
 * stays subtle — a verified PROFILE user is a verified identity, never an
 * influencer. Use these wrappers wherever a profile photo, org logo, credential
 * or featured achievement is framed.
 *
 * Frames: circle · squircle (softly rounded square) · geometric · org
 */
import type { ReactNode } from 'react'
import { ProfileSeal, type SealTone } from './ProfileSeal'

export type FrameShape = 'circle' | 'squircle' | 'geometric' | 'org'

const SHAPE_CLASS: Record<FrameShape, string> = {
  circle: 'rounded-full',
  squircle: 'rounded-[26%]',
  geometric: 'rounded-[18%]',
  org: 'rounded-[14%]',
}

export interface ProfileAvatarFrameProps {
  shape?: FrameShape
  size?: number
  /** Show the restrained verification seal in the corner. */
  verified?: boolean
  sealTone?: SealTone
  className?: string
  children: ReactNode
}

export function ProfileAvatarFrame({
  shape = 'circle',
  size = 72,
  verified,
  sealTone = 'green',
  className = '',
  children,
}: ProfileAvatarFrameProps) {
  const sealSize = Math.max(14, Math.round(size * 0.3))
  return (
    <span
      className={`relative inline-flex flex-none items-center justify-center overflow-hidden ${SHAPE_CLASS[shape]} ${className}`}
      style={{ height: size, width: size }}
    >
      {/* The geometric frame draws a thin structured edge + corner nodes for
          the geometric/org shapes; circle/squircle stay clean. */}
      {shape === 'geometric' && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[18%] border"
          style={{ borderColor: 'var(--profile-bright-blue)', borderWidth: 1.5 }}
        />
      )}
      {shape === 'org' && (
        <span
          aria-hidden
          className="pointer-events-none absolute inset-0 rounded-[14%] border-2"
          style={{ borderColor: 'var(--profile-powder)' }}
        />
      )}
      {children}
      {verified && (
        <span
          className="absolute bottom-0 right-0 flex items-center justify-center rounded-full"
          style={{
            background: 'var(--surface)',
            padding: 2,
            boxShadow: '0 0 0 1.5px var(--surface)',
          }}
          title="Verified identity"
        >
          <ProfileSeal size={sealSize} tone={sealTone} />
        </span>
      )}
    </span>
  )
}
