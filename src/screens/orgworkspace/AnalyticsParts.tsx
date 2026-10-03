import type { ReactNode } from 'react'
import type { MonthBar } from '@/app/orgAnalytics'

export function StatCard({ label, value, delta, tone }: { label: string; value: string | number; delta?: string; tone?: 'good' | 'neutral' }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-3.5 shadow-sm">
      <div className="mb-1.5 font-mono text-[10px] tracking-wider text-text-2">{label.toUpperCase()}</div>
      <div className="flex items-baseline gap-2">
        <span className="font-mono text-[21px] font-semibold text-text-0">{value}</span>
        {delta && <span className={`text-[11px] font-medium ${tone === 'good' ? 'text-success' : 'text-text-1'}`}>{delta}</span>}
      </div>
    </div>
  )
}

export function MonthChart({ title, months, barClass }: { title: string; months: MonthBar[]; barClass: string }) {
  return (
    <div className="mb-4 rounded-xl border border-border bg-surface p-5">
      <div className="mb-4 text-[13.5px] font-semibold text-text-0">{title}</div>
      <div className="flex h-[140px] items-end gap-1.5">
        {months.map((m, i) => (
          <div key={i} className="flex h-full flex-1 flex-col items-center justify-end gap-1.5" title={`${m.label}: ${m.count}`}>
            <div className={`w-full rounded-t ${barClass}`} style={{ height: `${m.h}%` }} />
            <span className="text-[9.5px] text-text-2">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function ListCard({ title, rows, empty, suffix = '' }: { title: string; rows: { label: string; count: number }[]; empty: string; suffix?: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5">
      <div className="mb-3 text-[13.5px] font-semibold text-text-0">{title}</div>
      {rows.length === 0 ? (
        <p className="text-xs text-text-1">{empty}</p>
      ) : (
        rows.map((b) => (
          <div key={b.label} className="flex justify-between gap-3 border-b border-border py-2 text-xs last:border-0">
            <span className="text-text-0">{b.label}</span>
            <span className="flex-none font-mono text-text-1">
              {b.count}
              {suffix}
            </span>
          </div>
        ))
      )}
    </div>
  )
}

export function Panel({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-border bg-surface p-5">{children}</div>
}
