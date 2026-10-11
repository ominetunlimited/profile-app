/**
 * EMPTY STATES (§14) — custom PROFILE illustrations, never generic SaaS art.
 *
 * Each combines exactly: one PROFILE geometric motif + one custom icon +
 * concise explanatory text + an appropriate action. The illustration uses
 * Powder Blue and the appropriate PROFILE accent, on-system.
 */
import type { ReactNode } from 'react'
import { ProfileGrid, ProfileNode, ProfileLink, ProfileSignal, ProfileOrbit, ProfilePath } from './motifs'

export type EmptyMotif = 'node' | 'link' | 'path' | 'grid' | 'signal' | 'orbit'

const MOTIFS: Record<EmptyMotif, (color: string) => ReactNode> = {
  node: (c) => <ProfileNode size={72} strokeWidth={1.4} color={c} />,
  link: (c) => <ProfileLink size={72} strokeWidth={1.4} color={c} />,
  path: (c) => <ProfilePath size={72} strokeWidth={1.4} color={c} />,
  grid: (c) => <ProfileGrid size={72} strokeWidth={1.4} color={c} />,
  signal: (c) => <ProfileSignal size={72} strokeWidth={1.4} color={c} />,
  orbit: (c) => <ProfileOrbit size={72} strokeWidth={1.4} color={c} />,
}

export interface ProfileEmptyStateProps {
  motif?: EmptyMotif
  /** Accent token used for the small status glyph; defaults to Bright Blue. */
  accent?: string
  title: string
  body: string
  action?: ReactNode
  className?: string
}

export function ProfileEmptyState({
  motif = 'node',
  accent = 'var(--profile-bright-blue)',
  title,
  body,
  action,
  className = '',
}: ProfileEmptyStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface px-6 py-12 text-center ${className}`}>
      {/* Illustration: Powder Blue motif + accent node */}
      <div className="relative flex h-[88px] w-[88px] items-center justify-center">
        <div
          className="absolute inset-0 rounded-full"
          style={{ background: 'color-mix(in srgb, var(--profile-powder) 45%, transparent)' }}
          aria-hidden
        />
        <div className="relative text-profile-powder" style={{ color: 'var(--profile-powder)' }}>
          {MOTIFS[motif](accent)}
        </div>
      </div>
      <div className="text-[15px] font-semibold text-text-0">{title}</div>
      <p className="max-w-[42ch] text-[13px] leading-relaxed text-text-1">{body}</p>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
