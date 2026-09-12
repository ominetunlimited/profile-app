import { BRAND } from '@/shared/brand/assets'

export type ProfileLogoState = 'loading' | 'idle' | 'error' | 'warning' | 'success'

const STATE_CLASS: Record<ProfileLogoState, string> = {
  loading: 'profile-logo-loading',
  idle: 'profile-logo-idle',
  error: 'profile-logo-error',
  warning: 'profile-logo-warning',
  success: 'profile-logo-success',
}

const STATE_LABEL: Record<ProfileLogoState, string> = {
  loading: 'Loading',
  idle: 'Offline',
  error: 'Something went wrong',
  warning: 'Needs attention',
  success: 'Done',
}

/**
 * §3.11/§3.12 Brand Motion System — the ONE shared logo-based state
 * indicator, meant to replace every generic spinner/toast icon in the
 * product rather than being reimplemented per screen. Colors come from the
 * theme tokens (tokens.css), never hardcoded hex, so it stays correct in
 * both light and dark mode. `prefers-reduced-motion` disables all animation
 * via tokens.css's own media query — this component never needs to check it.
 */
export function ProfileLogoAnimated({
  state = 'loading',
  size = 40,
  label,
}: {
  state?: ProfileLogoState
  size?: number
  label?: string
}) {
  return (
    <div role="status" aria-live="polite" className="inline-flex flex-col items-center gap-2">
      <img
        src={BRAND.mark}
        alt=""
        width={size}
        height={size}
        className={STATE_CLASS[state]}
        style={{ width: size, height: size }}
      />
      <span className="sr-only">{label ?? STATE_LABEL[state]}</span>
    </div>
  )
}
