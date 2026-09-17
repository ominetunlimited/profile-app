import { useEffect, useMemo, useRef, useState } from 'react'
import { resolveEntities, type EntityFieldContext, type EntityResolutionResult, type ResolvableEntityType } from '@/app/entityResolution'
import { TextInput } from './Field'
import { IconBuilding, IconPerson, IconTool } from './icons'

/**
 * V9 Unified Ecosystem Patch §3 — the one consistent typeahead UI every
 * tagging surface renders from, so two fields never look or behave
 * slightly differently for the same underlying capability (result grouping
 * by type, a small type badge per row, per the patch's own [DESIGN] note).
 *
 * Deliberately kept as a comma-list text field, not a rigid multi-select —
 * this build's existing storage contract for skills/tools/collaborators is
 * "plain free-text the user typed, never overwritten" (toolCatalogue.ts's
 * own resolveTool() doc). Picking a suggestion inserts its canonical label
 * into the list; unresolved free text stays fully typeable, since an
 * unmatched entry is "not an error" by this build's own existing rule.
 */
export function EntityAutocomplete({
  value,
  onChange,
  fieldContext,
  placeholder,
  multi = true,
}: {
  value: string
  onChange: (next: string) => void
  fieldContext: EntityFieldContext
  placeholder?: string
  /** false for a single-entity field (e.g. Trust Center's "Issuing
   * institution") — picking a suggestion replaces the whole value instead
   * of appending to a comma list. */
  multi?: boolean
}) {
  const [open, setOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement>(null)

  const segments = multi ? value.split(',') : [value]
  const currentSegment = segments[segments.length - 1] ?? ''
  const priorSegments = multi ? segments.slice(0, -1) : []

  const results = useMemo(() => resolveEntities(currentSegment, fieldContext), [currentSegment, fieldContext])

  useEffect(() => {
    if (!open) return
    function onOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', onOutside)
    return () => document.removeEventListener('mousedown', onOutside)
  }, [open])

  function pick(r: EntityResolutionResult) {
    if (!multi) {
      onChange(r.displayLabel)
      setOpen(false)
      return
    }
    const cleanedPrior = priorSegments.map((s) => s.trim()).filter(Boolean)
    onChange([...cleanedPrior, r.displayLabel].join(', ') + ', ')
    setOpen(false)
  }

  return (
    <div className="relative" ref={containerRef}>
      <TextInput
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
        }}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
      />
      {open && currentSegment.trim() && results.length > 0 && (
        <div role="listbox" aria-label="Suggestions" className="absolute z-10 mt-1 w-full overflow-hidden rounded-lg border border-border-strong bg-surface shadow-lg">
          {results.map((r) => (
            <button
              key={`${r.type}-${r.id}`}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                pick(r)
              }}
              className="flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-surface-sunken"
            >
              <TypeBadge type={r.type} />
              <span className="text-text-0">{r.displayLabel}</span>
              {r.sub && <span className="ml-auto text-xs text-text-2">{r.sub}</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

function TypeBadge({ type }: { type: ResolvableEntityType }) {
  if (type === 'individual') return <IconPerson size={13} className="flex-none text-text-2" />
  if (type === 'organisation') return <IconBuilding size={13} className="flex-none text-text-2" />
  if (type === 'tool') return <IconTool size={13} className="flex-none text-text-2" />
  return <span className="flex-none rounded border border-border px-1 text-[9px] uppercase text-text-2">Skill</span>
}
