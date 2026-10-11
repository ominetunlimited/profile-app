import type { ButtonHTMLAttributes } from 'react'

/**
 * §11 BUTTONS — PROFILE identity. No generic gradients, no excessive pills;
 * corners stay controlled and consistent (rounded-lg via the token radius).
 *
 *   primary    — Bright Blue #1E63D6, Off-White text
 *   dark       — Royal Blue #162660, Off-White text (strong brand surface)
 *   verify     — Gold #D4AF37, Royal text (verification action)
 *   success    — Green #2BC48A, Royal text
 *   secondary  — Powder Blue #D0E6FD, Royal text
 *   ghost      — transparent, inherits text colour
 */
type Variant = 'primary' | 'dark' | 'verify' | 'success' | 'secondary' | 'ghost'

const VARIANT_CLASSES: Record<Variant, string> = {
  // Primary interactive — Bright Blue fill, Off-White text (5.13:1).
  primary: 'bg-accent-solid text-profile-off-white hover:bg-accent-hover disabled:bg-surface-sunken disabled:text-text-2 disabled:cursor-not-allowed',
  // Dark primary — Royal Blue fill on light surfaces.
  dark: 'bg-profile-royal text-profile-off-white hover:opacity-90 disabled:bg-surface-sunken disabled:text-text-2 disabled:cursor-not-allowed',
  // Verification action — Gold fill, Royal text (6.75:1).
  verify: 'bg-profile-gold text-profile-royal hover:opacity-90 disabled:bg-surface-sunken disabled:text-text-2 disabled:cursor-not-allowed',
  // Success — Green fill, Royal text (6.33:1).
  success: 'bg-profile-green text-profile-royal hover:opacity-90 disabled:bg-surface-sunken disabled:text-text-2 disabled:cursor-not-allowed',
  // Secondary — Powder Blue fill, Royal text.
  secondary: 'bg-profile-powder text-profile-royal border border-border-strong hover:opacity-90 disabled:bg-surface-sunken disabled:text-text-2 disabled:cursor-not-allowed',
  ghost: 'bg-transparent text-text-1 hover:text-text-0',
}

export function Button({
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant }) {
  return (
    <button
      type="button"
      className={`inline-flex min-h-[44px] items-center justify-center rounded-lg px-5 font-sans text-sm font-semibold transition-colors ${VARIANT_CLASSES[variant]} ${className}`}
      {...props}
    />
  )
}
