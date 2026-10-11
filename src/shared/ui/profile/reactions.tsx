/**
 * PROFILE CUSTOM REACTION SYSTEM (§6) — geometric symbols sharing one visual
 * DNA, deliberately NOT copied social-media emoji reactions.
 *
 * Each reaction is a small geometric form built on the same 24×24 node grammar
 * as the rest of the system (consistent 1.75 stroke, round caps/joins, optical
 * size). They read as members of one family — each one instantly distinct from
 * the other five, and unmistakably PROFILE:
 *
 *   Recognition   — a faceted four-point spark node
 *   Appreciation  — a structured heart cut from PROFILE angular geometry
 *   Insight       — an eye/signal node around a single identity point
 *   Support       — two linked nodes leaning into each other
 *   Achievement   — a faceted seal/badge node with a check vertex
 *   Interesting   — a radiating signal node (the discovery motif)
 *
 * Mapped onto the existing ReactionType union so no data model / schema change
 * is required — only the glyph each reaction renders with.
 */
import type { ReactionType } from '@/app/reactionStore'
import type { ComponentType } from 'react'

export interface ReactionIconProps {
  size?: number
  className?: string
  filled?: boolean
  /** Override colour (sets CSS color, which currentColor uses). */
  color?: string
}

const SW = 1.75

function R({ size = 20, className, color, fill, children }: ReactionIconProps & { fill?: string; children: React.ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill ?? 'none'}
      stroke="currentColor"
      strokeWidth={SW}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      style={color ? { color } : undefined}
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Recognition — a faceted four-point spark node (distilled, not a 5-point emoji star). */
function ReactionRecognize({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 2.6 14.1 9.9 21.4 12 14.1 14.1 12 21.4 9.9 14.1 2.6 12 9.9 9.9Z" />
    </R>
  )
}

/** Appreciation — a structured heart assembled from PROFILE angular geometry. */
function ReactionAppreciate({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20.6C9.4 18.2 3.6 13.9 3.6 9.5A4.6 4.6 0 0 1 12 7.1a4.6 4.6 0 0 1 8.4 2.4c0 4.4-5.8 8.7-8.4 11.1Z" />
      <path d="M12 9.6v4M10 11.6h4" fill="none" stroke={filled ? 'var(--surface)' : 'currentColor'} strokeWidth={1.4} opacity={filled ? 1 : 0.55} />
    </R>
  )
}

/** Insight — a geometric eye/signal: an eye outline around a single identity node. */
function ReactionInsight({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p}>
      <path d="M2.4 12S6 6.4 12 6.4 21.6 12 21.6 12 18 17.6 12 17.6 2.4 12 2.4 12Z" />
      <circle cx="12" cy="12" r="2.7" fill={filled ? 'currentColor' : 'none'} />
    </R>
  )
}

/** Support — two linked geometric nodes leaning into each other. */
function ReactionSupport({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p}>
      <circle cx="8" cy="12" r="3.1" fill={filled ? 'currentColor' : 'none'} />
      <circle cx="16" cy="12" r="3.1" fill={filled ? 'currentColor' : 'none'} />
      <path d="M11.1 12h1.8" />
    </R>
  )
}

/** Achievement — a faceted seal/badge: faceted node with a verification vertex. */
function ReactionAchieve({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 2.7 19.6 5.9v5.6c0 4-3 7.2-7.6 8.4-4.6-1.2-7.6-4.4-7.6-8.4V5.9Z" />
      <path d="M8.9 12 11.3 14.4 15.6 9.4" fill="none" stroke={filled ? 'var(--surface)' : 'currentColor'} strokeWidth={SW} />
    </R>
  )
}

/** Interesting — a radiating signal node (the discovery motif). */
function ReactionInteresting({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p}>
      <circle cx="12" cy="12" r="2.5" fill={filled ? 'currentColor' : 'none'} />
      <path d="M12 6.2a5.8 5.8 0 0 1 5.8 5.8" />
      <path d="M6.2 12A5.8 5.8 0 0 1 12 6.2" />
      <path d="M18.8 12A6.8 6.8 0 0 0 12 5.2" opacity="0.5" />
    </R>
  )
}

/** ReactionType → geometric icon, one shared family (§6). */
export const REACTION_GLYPH: Record<ReactionType, ComponentType<ReactionIconProps>> = {
  appreciate: ReactionAppreciate,
  respect: ReactionRecognize,
  insightful: ReactionInsight,
  support: ReactionSupport,
  skilled: ReactionAchieve,
  well_explained: ReactionInteresting,
}
