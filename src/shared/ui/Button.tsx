import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'secondary' | 'ghost'

const VARIANT_CLASSES: Record<Variant, string> = {
  primary: 'bg-accent text-white hover:opacity-90 disabled:bg-surface-sunken disabled:text-text-2 disabled:cursor-not-allowed',
  secondary: 'border border-border-strong bg-surface text-text-0 hover:border-accent',
  ghost: 'text-text-1 hover:text-text-0',
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
