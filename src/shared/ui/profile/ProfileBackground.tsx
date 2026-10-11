/**
 * GEOMETRIC BACKGROUND SYSTEM (§8) — subtle PROFILE geometry that quietly sits
 * behind the entire platform: landing, profile, organisation, verification,
 * onboarding, dashboards, search, activity, empty states, auth, settings,
 * portfolio and credential screens.
 *
 * Rules baked in:
 *  - Decoration never competes with content (pointer-events-none, aria-hidden,
 *    low opacity, behind everything).
 *  - Background motifs use Powder Blue (#D0E6FD) at low opacity on light, and
 *    Powder on the Royal Blue in dark — derived from --profile-geometric.
 *  - On Royal Blue surfaces we use Warm Beige / Off-White at very low opacity.
 *  - Elements may sit partially outside the container / cropped by the viewport,
 *    giving a quiet sense that one PROFILE system exists behind everything.
 *  - §22: scale and opacity reduce automatically on small screens.
 */
import type { ReactNode } from 'react'
import { ProfileGrid, ProfileNode, ProfileLink, ProfileOrbit } from './motifs'

export type BackgroundVariant = 'grid' | 'nodes' | 'orbit' | 'mixed'

const DECOR = 'profile-decor pointer-events-none absolute inset-0 -z-10 overflow-hidden'

/** Soft radial wash so the flat beige/navy reads as a designed surface. */
function Wash({ onDark }: { onDark?: boolean }) {
  return (
    <div
      className="absolute inset-0"
      style={{
        background: onDark
          ? 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--profile-powder) 10%, transparent) 0%, transparent 60%)'
          : 'radial-gradient(120% 80% at 50% 0%, color-mix(in srgb, var(--profile-powder) 55%, transparent) 0%, transparent 62%)',
      }}
    />
  )
}

/**
 * A single quiet motif watermark, cropped by the viewport edge. Colour is the
 * geometric token at a low opacity, passed via `color`.
 */
function CroppedMotif({ children, className, opacity }: { children: ReactNode; className: string; opacity: number }) {
  return (
    <div className={`absolute ${className}`} style={{ opacity }} aria-hidden>
      {children}
    </div>
  )
}

export interface ProfileBackgroundProps {
  variant?: BackgroundVariant
  /** Render the warm/powder treatment for use on a dark Royal Blue surface. */
  onDark?: boolean
  className?: string
  /** Content to layer above the decoration. Omit for a pure backdrop layer. */
  children?: ReactNode
}

/**
 * Wrap a screen's content in this (as the outermost element) to inherit the
 * PROFILE geometric backdrop. Content should be rendered as normal children —
 * the decoration is layered behind via -z-10. With no children it renders as a
 * standalone backdrop layer (useful dropped into an already-`relative` section).
 */
export function ProfileBackground({ variant = 'mixed', onDark, className = '', children }: ProfileBackgroundProps) {
  // On light surfaces the geometry is Powder; on the dark navy we lift to a
  // warm Beige so it reads as the same system against #162660 (§8).
  const geo = onDark ? 'var(--profile-beige)' : 'var(--profile-geometric)'
  const o = (n: number) => (onDark ? Math.max(2, n - 4) : n) / 100

  return (
    <div className={`relative isolate ${className}`}>
      <div className={DECOR} aria-hidden>
        <Wash onDark={onDark} />
        {(variant === 'grid' || variant === 'mixed') && (
          <div
            className="absolute inset-0 profile-grid-bg-fine"
            style={{ opacity: o(onDark ? 5 : 8), color: geo, ['--profile-geometric' as string]: geo }}
          />
        )}
        {(variant === 'nodes' || variant === 'mixed') && (
          <>
            <CroppedMotif className="-right-10 -top-10" opacity={o(12)}>
              <ProfileNode size={220} strokeWidth={1.1} color={geo} />
            </CroppedMotif>
            <CroppedMotif className="-bottom-16 -left-12" opacity={o(10)}>
              <ProfileLink size={200} strokeWidth={1.1} color={geo} />
            </CroppedMotif>
          </>
        )}
        {(variant === 'orbit' || variant === 'mixed') && (
          <CroppedMotif className="right-[8%] top-[18%] hidden md:block" opacity={o(12)}>
            <ProfileOrbit size={140} strokeWidth={1} color={geo} />
          </CroppedMotif>
        )}
        {variant === 'mixed' && (
          <CroppedMotif className="left-[6%] bottom-[10%] hidden lg:block" opacity={o(10)}>
            <ProfileGrid size={120} strokeWidth={1} color={geo} />
          </CroppedMotif>
        )}
      </div>
      {children}
    </div>
  )
}
