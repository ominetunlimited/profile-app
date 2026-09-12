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

export function PasswordInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const [visible, setVisible] = useState(false)
  return (
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
  )
}
