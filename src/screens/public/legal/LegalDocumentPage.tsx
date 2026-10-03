import { Link } from 'react-router-dom'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { LEGAL_DOCS, findLegalDoc } from './legalContent'

/** Shared renderer for every /legal-family route — one component, one visual
 * language, per build doc §1's "never invent a one-off style" rule. */
export function LegalDocumentPage({ path }: { path: string }) {
  const doc = findLegalDoc(path)
  if (!doc) return null

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[760px] px-4 pb-16 pt-8 sm:px-7">
        <nav aria-label="Legal documents" className="mb-6 flex flex-wrap gap-[7px]">
          {LEGAL_DOCS.map((d) => (
            <Link
              key={d.path}
              to={d.path}
              aria-current={d.path === path ? 'page' : undefined}
              className={`rounded-[9px] border-[1.5px] px-[13px] py-2 text-xs font-semibold ${
                d.path === path ? 'border-accent bg-accent-solid text-white' : 'border-border bg-surface text-text-1'
              }`}
            >
              {d.title}
            </Link>
          ))}
        </nav>

        <div className="mb-6 rounded-lg border border-warning bg-surface-sunken p-4 text-xs leading-relaxed text-text-1">
          This document is a working draft and is being reviewed by qualified legal counsel in each operating
          jurisdiction before it is finalised.
          {doc.pendingDraft && (
            <span className="mt-1 block font-semibold text-warning">
              The full text of this document is still being drafted — the summary below describes how PROFILE
              handles this area in the meantime.
            </span>
          )}
        </div>

        <h1 className="mb-1.5 text-2xl font-bold leading-tight tracking-tight text-text-0">{doc.title}</h1>
        <div className="mb-[22px] text-xs text-text-2">Draft · under legal review</div>
        <p className="mb-8 rounded-lg border-l-4 border-accent bg-surface-sunken p-4 text-sm leading-relaxed text-text-0">
          <strong>In plain terms:</strong> {doc.plainSummary}
        </p>

        <div className="flex flex-col gap-[18px]">
          {doc.body.map((para, i) => (
            <p key={i} className="text-[13px] leading-[1.7] text-text-1">
              {para}
            </p>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
