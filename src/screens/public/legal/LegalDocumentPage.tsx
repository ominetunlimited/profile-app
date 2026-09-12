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
      <main className="mx-auto max-w-[760px] px-4 py-14 sm:px-8">
        <nav aria-label="Legal documents" className="mb-8 flex flex-wrap gap-1.5">
          {LEGAL_DOCS.map((d) => (
            <Link
              key={d.path}
              to={d.path}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${
                d.path === path ? 'border-accent bg-surface-sunken text-accent' : 'border-border text-text-1'
              }`}
            >
              {d.title}
            </Link>
          ))}
        </nav>

        <div className="mb-6 rounded-lg border border-warning bg-surface-sunken p-4 text-xs leading-relaxed text-text-1">
          Founder-facing starting copy, written in PROFILE's brand voice. This requires review by qualified legal
          counsel in each operating jurisdiction before publication — standard practice for any platform handling
          identity documents and credential data, not a gap in this build.
          {doc.pendingDraft && (
            <span className="mt-1 block font-semibold text-warning">
              This specific document has no canonical text in the Master Prompt yet — the content below is a
              structural placeholder grounded in the spec, pending full drafting.
            </span>
          )}
        </div>

        <h1 className="mb-3 text-3xl font-bold tracking-tight text-text-0">{doc.title}</h1>
        <p className="mb-8 rounded-lg border-l-4 border-accent bg-surface-sunken p-4 text-sm leading-relaxed text-text-0">
          <strong>In plain terms:</strong> {doc.plainSummary}
        </p>

        <div className="flex flex-col gap-4">
          {doc.body.map((para, i) => (
            <p key={i} className="text-sm leading-relaxed text-text-1">
              {para}
            </p>
          ))}
        </div>
      </main>
      <PublicFooter />
    </div>
  )
}
