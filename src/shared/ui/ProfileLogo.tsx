import { BRAND_LOGOS } from '@/shared/brand/assets'

export type ProfileLogoVariant = 'horizontal' | 'primary' | 'symbol'
export type ProfileLogoSurface = 'auto' | 'on-light' | 'on-dark'

/**
 * Theme-aware PROFILE logo. Renders the light and dark artwork together and
 * lets CSS (.dark) show the right one, so it follows the in-app colour mode
 * with no JS and no flash. Use surface="on-dark" / "on-light" only where a
 * surface is always one tone regardless of theme.
 *
 * The symbol uses its transparent artwork, which reads on both light and dark.
 */
export function ProfileLogo({
  variant = 'horizontal',
  surface = 'auto',
  className = '',
  alt = 'PROFILE',
}: {
  variant?: ProfileLogoVariant
  surface?: ProfileLogoSurface
  className?: string
  alt?: string
}) {
  if (variant === 'symbol') {
    return <img src={BRAND_LOGOS.symbol.transparent} alt={alt === 'PROFILE' ? '' : alt} className={className} />
  }
  const set = BRAND_LOGOS[variant]
  if (surface === 'on-light') return <img src={set.light} alt={alt} className={className} />
  if (surface === 'on-dark') return <img src={set.dark} alt={alt} className={className} />
  return (
    <>
      <img src={set.light} alt={alt} className={`${className} profile-logo-for-light`} />
      <img src={set.dark} alt="" aria-hidden="true" className={`${className} profile-logo-for-dark`} />
    </>
  )
}
