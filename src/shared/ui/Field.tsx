import { useState, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes } from 'react'

export function Field({
  label,
  hint,
  error,
  children,
}: {
  label: string
  hint?: string
  error?: string
  children: ReactNode
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-xs font-medium text-text-0">{label}</span>
      {children}
      {error ? (
        <span role="alert" aria-live="polite" className="text-xs text-warning">
          {error}
        </span>
      ) : hint ? (
        <span className="text-xs text-text-1">{hint}</span>
      ) : null}
    </label>
  )
}

const inputClass =
  'min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent'

/** Merges a caller's className with the base style instead of one silently
 * replacing the other — fixes a bug hit repeatedly (`className` spread after
 * `inputClass` was overriding it entirely, dropping the base input styling
 * whenever a caller passed extra layout classes like `flex-1`). */
function withInputClass(extra?: string): string {
  return extra ? `${inputClass} ${extra}` : inputClass
}

export function TextInput({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={withInputClass(className)} {...props} />
}

export function SelectInput({ className, ...props }: SelectHTMLAttributes<HTMLSelectElement>) {
  return <select className={withInputClass(className)} {...props} />
}

/** §7.1's real strength score — the same 4 checks `passwordMeetsPolicy`
 * (accountTypes.ts) requires, counted rather than boolean, so a password
 * missing 1 of 4 checks visibly differs from one missing all 4. */
function passwordStrength(value: string): 0 | 1 | 2 | 3 | 4 {
  if (!value) return 0
  const checks = [value.length >= 8, /[a-z]/.test(value), /[A-Z]/.test(value), /[0-9]/.test(value) || /[^A-Za-z0-9]/.test(value)]
  return checks.filter(Boolean).length as 0 | 1 | 2 | 3 | 4
}

const STRENGTH_LABEL = ['Too short', 'Weak', 'Fair', 'Good', 'Strong']
const STRENGTH_COLOR = ['var(--danger)', 'var(--danger)', 'var(--warning)', 'var(--accent)', 'var(--success)']

export function PasswordInput({ showStrength, ...props }: InputHTMLAttributes<HTMLInputElement> & { showStrength?: boolean }) {
  const [visible, setVisible] = useState(false)
  const strength = showStrength ? passwordStrength(String(props.value ?? '')) : null
  return (
    <div>
      <span className="flex items-center rounded-lg border border-border-strong bg-surface">
        <input type={visible ? 'text' : 'password'} className="min-h-[44px] flex-1 rounded-lg bg-transparent px-3 text-sm text-text-0 outline-none" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          className="mr-1 flex-none px-2 text-xs text-text-1"
        >
          {visible ? 'Hide' : 'Show'}
        </button>
      </span>
      {strength !== null && String(props.value ?? '').length > 0 && (
        <div className="mt-1.5 flex items-center gap-2">
          <div className="flex flex-1 gap-1">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="h-1 flex-1 rounded-full" style={{ background: i < strength ? STRENGTH_COLOR[strength] : 'var(--border)' }} />
            ))}
          </div>
          <span className="text-[10.5px] text-text-2">{STRENGTH_LABEL[strength]}</span>
        </div>
      )}
    </div>
  )
}
