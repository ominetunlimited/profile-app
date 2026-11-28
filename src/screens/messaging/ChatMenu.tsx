import { useEffect, useRef, type ReactNode } from 'react'

/** Shared popover menu for chat: icon + label rows, closes on outside click / Escape. */
export function ChatMenu({ open, onClose, align = 'right', up = false, children, label }: { open: boolean; onClose: () => void; align?: 'left' | 'right'; up?: boolean; children: ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) onClose() }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('mousedown', onDown)
    document.addEventListener('keydown', onKey)
    return () => { document.removeEventListener('mousedown', onDown); document.removeEventListener('keydown', onKey) }
  }, [open, onClose])
  if (!open) return null
  return (
    <div ref={ref} role="menu" aria-label={label} className={`absolute z-30 min-w-[210px] rounded-2xl border border-border bg-surface p-1.5 shadow-xl ${align === 'right' ? 'right-0' : 'left-0'} ${up ? 'bottom-full mb-2' : 'top-full mt-2'}`}>
      {children}
    </div>
  )
}

export function MenuItem({ icon, children, onClick, danger = false }: { icon: ReactNode; children: ReactNode; onClick: () => void; danger?: boolean }) {
  return (
    <button role="menuitem" onClick={onClick} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2 text-left text-[13px] font-medium transition-colors hover:bg-surface-sunken ${danger ? 'text-danger' : 'text-text-0'}`}>
      <span className={`flex-none ${danger ? '' : 'text-text-1'}`}>{icon}</span>
      {children}
    </button>
  )
}
