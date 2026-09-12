import { useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { Field, SelectInput } from '@/shared/ui/Field'
import { useAccount } from '@/app/AccountContext'
import { ownerKey } from '@/app/activityStore'
import { listFeedback, submitFeedback, type FeedbackEntry } from '@/app/feedbackStore'

export function FeedbackCentre() {
  const { account, staffRole } = useAccount()
  const owner = account ? ownerKey(account) : staffRole ? 'staff' : 'guest'
  const [entries, setEntries] = useState(() => listFeedback(owner))
  const [category, setCategory] = useState<FeedbackEntry['category']>('idea')
  const [message, setMessage] = useState('')

  function send() {
    if (!message.trim()) return
    submitFeedback({ ownerEmail: owner, category, message: message.trim() })
    setMessage('')
    setEntries(listFeedback(owner))
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[640px] px-4 py-8 sm:px-6">
        <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Feedback Centre</h1>
        <p className="mb-6 text-sm text-text-1">Tell us what's working, what's broken, or what you'd like to see.</p>

        <div className="mb-8 flex flex-col gap-3 rounded-xl border border-border bg-surface p-4">
          <Field label="Category">
            <SelectInput value={category} onChange={(e) => setCategory(e.target.value as FeedbackEntry['category'])}>
              <option value="idea">Idea</option>
              <option value="bug">Bug report</option>
              <option value="praise">Praise</option>
              <option value="other">Other</option>
            </SelectInput>
          </Field>
          <Field label="Message">
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              rows={4}
              placeholder="What's on your mind?"
              className="min-h-[44px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
            />
          </Field>
          <button onClick={send} disabled={!message.trim()} className="self-start rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40">
            Send feedback
          </button>
        </div>

        <h2 className="mb-3 font-semibold text-text-0">Your submissions</h2>
        {entries.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-6 text-center text-sm text-text-1">Nothing submitted yet.</div>
        ) : (
          <div className="flex flex-col gap-2">
            {entries.map((e) => (
              <div key={e.id} className="rounded-lg border border-border bg-surface p-3 text-sm">
                <span className="mr-2 rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase text-text-2">{e.category}</span>
                {e.message}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
