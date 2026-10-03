import type { VerificationRequest } from './verificationRequestStore'

/** Real numbers for an issuer's analytics pages, computed from the requests addressed to it. Nothing here is estimated or filled in. */
export interface MonthBar {
  label: string
  count: number
  /** Bar height as a percentage of the busiest month (0 when nothing happened). */
  h: number
}

export interface IssuerAnalytics {
  confirmedThisMonth: number
  confirmedLastMonth: number
  avgResponseDays: number | null
  avgResponseDaysLastMonth: number | null
  rejectionRate: number | null
  pending: number
  totalConfirmed: number
  months: MonthBar[]
  /** Share of confirmed requests answered within each window; null until something has been confirmed. */
  responseBands: { label: string; share: number }[] | null
  byType: { label: string; count: number }[]
}

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
const DAY = 86_400_000

const monthKey = (d: Date) => d.getFullYear() * 12 + d.getMonth()
const days = (r: VerificationRequest) => (new Date(r.decidedAt as string).getTime() - new Date(r.submittedAt).getTime()) / DAY

export function computeIssuerAnalytics(requests: VerificationRequest[], now = new Date()): IssuerAnalytics {
  const confirmed = requests.filter((r) => r.status === 'verified' && r.decidedAt)
  const rejected = requests.filter((r) => r.status === 'rejected')
  const thisMonth = monthKey(now)
  const inMonth = (rows: VerificationRequest[], key: number) => rows.filter((r) => monthKey(new Date(r.decidedAt ?? r.submittedAt)) === key)
  const avg = (rows: VerificationRequest[]) => (rows.length ? rows.reduce((s, r) => s + days(r), 0) / rows.length : null)

  const bars = Array.from({ length: 12 }, (_, i) => {
    const key = thisMonth - 11 + i
    return { label: MONTHS[((key % 12) + 12) % 12], count: inMonth(confirmed, key).length }
  })
  const max = Math.max(...bars.map((b) => b.count), 0)

  const bands = [
    { label: 'Same day', test: (d: number) => d < 1 },
    { label: '1–3 days', test: (d: number) => d >= 1 && d < 4 },
    { label: '4–7 days', test: (d: number) => d >= 4 && d < 8 },
    { label: '8+ days', test: (d: number) => d >= 8 },
  ]

  const byType = new Map<string, number>()
  for (const r of confirmed) byType.set(r.moduleName, (byType.get(r.moduleName) ?? 0) + 1)

  const decided = confirmed.length + rejected.length
  return {
    confirmedThisMonth: inMonth(confirmed, thisMonth).length,
    confirmedLastMonth: inMonth(confirmed, thisMonth - 1).length,
    avgResponseDays: avg(confirmed),
    avgResponseDaysLastMonth: avg(inMonth(confirmed, thisMonth - 1)),
    rejectionRate: decided ? (rejected.length / decided) * 100 : null,
    pending: requests.filter((r) => r.status !== 'verified' && r.status !== 'rejected').length,
    totalConfirmed: confirmed.length,
    months: bars.map((b) => ({ ...b, h: max ? Math.max(4, Math.round((b.count / max) * 100)) : 0 })),
    responseBands: confirmed.length ? bands.map((b) => ({ label: b.label, share: Math.round((confirmed.filter((r) => b.test(days(r))).length / confirmed.length) * 100) })) : null,
    byType: [...byType.entries()].map(([label, count]) => ({ label, count })).sort((a, b) => b.count - a.count),
  }
}

export const formatDays = (d: number | null) => (d == null ? '—' : d < 1 ? `${Math.max(1, Math.round(d * 24))}h` : `${d.toFixed(1)}d`)
