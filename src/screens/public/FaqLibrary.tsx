import { useState } from 'react'
import { PublicHeader } from '@/shared/ui/PublicHeader'
import { PublicFooter } from '@/shared/ui/PublicFooter'
import { FAQ_ITEMS } from './legal/faqContent'

/** §45 FAQ Library, canonical for /help/faq. */
export function FaqLibrary() {
  const [openIndex, setOpenIndex] = useState<number | null>(null)

  return (
    <div className="min-h-screen bg-bg">
      <PublicHeader />
      <main className="mx-auto max-w-[760px] px-4 py-14 sm:px-8">
        <h1 className="mb-8 text-3xl font-bold tracking-tight text-text-0">Frequently asked questions</h1>
        <div className="flex flex-col gap-2">
          {FAQ_ITEMS.map((item, i) => {
            const open = openIndex === i
            return (
              <div key={item.q} className="rounded-lg border border-border bg-surface">
                <button
                  onClick={() => setOpenIndex(open ? null : i)}
                  aria-expanded={open}
                  className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left"
                >
                  <span className="font-medium text-text-0">{item.q}</span>
                  <span className="flex-none text-text-2">{open ? '−' : '+'}</span>
                </button>
                {open && <p className="px-4 pb-4 text-sm leading-relaxed text-text-1">{item.a}</p>}
              </div>
            )
          })}
        </div>
        <p className="mt-8 text-sm text-text-1">
          If your question isn't answered here, reach out to us directly and we'll get you a straight answer.
        </p>
      </main>
      <PublicFooter />
    </div>
  )
}
