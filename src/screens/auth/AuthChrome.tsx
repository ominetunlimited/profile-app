import { Link } from 'react-router-dom'
import { ColourModeSelect } from '@/shared/ui/ColourModeSelect'
import type { ReactNode } from 'react'
import { ProfileLogo } from '@/shared/ui/ProfileLogo'
import { ProfileBackground } from '@/shared/ui/profile/ProfileBackground'

/** §6.2/§7.1/§8 shared chrome: logo + theme toggle, matching the Handoff's Sign
 * In / Account Creation pages exactly (a plain header, no full public nav).
 *
 * §8 — the whole auth flow sits on the PROFILE geometric background (quiet
 * node/grid motifs), so even the entry point carries the identity. */
export function AuthChrome({
  maxWidth = 460,
  progress,
  children,
}: {
  maxWidth?: number
  progress?: { stepNum: number; stepCount: number; stepName: string }
  children: ReactNode
}) {

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[5fr_6fr]">
      <aside
        aria-hidden="true"
        className="relative hidden flex-col justify-between overflow-hidden p-12 text-[var(--profile-off-white)] lg:flex"
        style={{ background: 'var(--profile-royal)' }}
      >
        <ProfileLogo variant="symbol" className="h-28 w-28" />
        <div>
          <p className="text-[clamp(30px,3.4vw,46px)] font-extrabold leading-[1.05] tracking-tight">
            Put your work on the record.
          </p>
          <p className="mt-3 max-w-[34ch] text-[15px] leading-relaxed opacity-80">
            Evidence, verified by the people who were there. You decide what is public.
          </p>
        </div>
        <span className="text-xs opacity-60">PROFILE</span>
      </aside>
    <ProfileBackground variant="nodes" className="flex min-h-screen flex-col items-center px-4 py-10 lg:justify-center">
      <div className="w-full" style={{ maxWidth }}>
        <div className="mb-6 flex items-center justify-between">
          <Link to="/" className="flex items-center">
            <ProfileLogo variant="horizontal" className="h-14 w-auto" />
          </Link>
          <ColourModeSelect className="h-8" />
        </div>

        {progress && (
          <div className="mb-6 flex items-center gap-3 rounded-t-2xl border border-b-0 border-border bg-surface-sunken px-4 py-3">
            <span className="flex-1 text-xs text-text-1">
              Step {progress.stepNum} of {progress.stepCount} · {progress.stepName}
            </span>
            <span className="h-1.5 w-28 overflow-hidden rounded-full bg-border">
              <span
                className="block h-full rounded-full bg-accent transition-all"
                style={{ width: `${Math.round((progress.stepNum / progress.stepCount) * 100)}%` }}
              />
            </span>
          </div>
        )}

        <div
          className={`rounded-2xl border border-border bg-surface p-6 shadow-sm sm:p-8 ${progress ? 'rounded-t-none border-t-0' : ''}`}
        >
          {children}
        </div>
      </div>
    </ProfileBackground>
    </div>
  )
}
