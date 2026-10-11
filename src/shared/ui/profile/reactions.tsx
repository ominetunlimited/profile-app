/**
 * PROFILE CUSTOM REACTION SYSTEM (§6) — geometric symbols sharing one visual
 * DNA, deliberately NOT copied social-media emoji reactions.
 *
 * Each reaction is a small geometric form built on the same 24×24 node grammar
 * as the rest of the system (consistent stroke, corner treatment, optical
 * size). They read as members of one family:
 *
 *   Recognition   — geometric star/spark node
 *   Appreciation  — structured heart from PROFILE geometry (not an emoji heart)
 *   Insight       — geometric eye/signal node
 *   Support       — two connected geometric forms
 *   Achievement   — geometric seal/badge node
 *   Interesting   — radiating signal node
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

/** Recognition — a geometric four-point spark/star node (distilled, not a 5-point emoji star). */
function ReactionRecognize({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3l1.9 5.6L19.5 10l-4.4 3.3.9 5.7L12 16.2 8 19l.9-5.7L4.5 10l5.6-1.4L12 3Z" />
    </R>
  )
}

/** Appreciation — a structured heart assembled from PROFILE angular geometry. */
function ReactionAppreciate({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 20s-7.2-4.6-7.2-9.4A4.1 4.1 0 0 1 12 8.2a4.1 4.1 0 0 1 7.2 2.4C19.2 15.4 12 20 12 20Z" />
      <circle cx="12" cy="11" r="1.1" fill={filled ? 'var(--surface)' : 'currentColor'} stroke="none" />
    </R>
  )
}

/** Insight — a geometric eye/signal: an eye outline around a single identity node. */
function ReactionInsight({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p}>
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.6" fill={filled ? 'currentColor' : 'none'} />
    </R>
  )
}

/** Support — two connected geometric nodes leaning into each other. */
function ReactionSupport({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p}>
      <circle cx="8" cy="12" r="3" fill={filled ? 'currentColor' : 'none'} />
      <circle cx="16" cy="12" r="3" fill={filled ? 'currentColor' : 'none'} />
      <path d="M11 12h2" />
    </R>
  )
}

/** Achievement — a geometric seal/badge: faceted node with a laureat notch. */
function ReactionAchieve({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p} fill={filled ? 'currentColor' : 'none'}>
      <path d="M12 3l7 3v5.5c0 3.8-2.9 6.9-7 8-4.1-1.1-7-4.2-7-8V6l7-3Z" />
      <path d="M9.5 12l1.8 1.8 3.4-3.8" fill="none" stroke={filled ? 'var(--surface)' : 'currentColor'} strokeWidth={SW} />
    </R>
  )
}

/** Interesting — a radiating signal node (the discovery motif). */
function ReactionInteresting({ filled, ...p }: ReactionIconProps) {
  return (
    <R {...p}>
      <circle cx="12" cy="12" r="2.4" fill={filled ? 'currentColor' : 'none'} />
      <path d="M12 6.4a5.6 5.6 0 0 1 5.6 5.6" />
      <path d="M6.4 12A5.6 5.6 0 0 1 12 6.4" />
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
