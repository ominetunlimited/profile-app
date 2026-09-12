import { useState } from 'react'
import { Field, TextInput, SelectInput } from '@/shared/ui/Field'
import { InternalNav } from './InternalNav'
import {
  createOwnerContentDraft,
  deleteOwnerContent,
  listOwnerContent,
  publishOwnerContent,
  type OwnerContentAudience,
  type OwnerContentType,
} from '@/app/ownerContentStore'

const TYPES: OwnerContentType[] = ['news', 'blog', 'announcement']
const AUDIENCES: OwnerContentAudience[] = ['public', 'individual', 'organisation', 'all_signed_in']

/**
 * Patch (pre-Phase-7) B8: staff-only composer for the public Blog & News
 * page's content — that page (screens/public/BlogNews.tsx) currently has a
 * real, honest empty state because nothing has ever populated it. This
 * console gives staff a real write path (ownerContentStore.ts); wiring
 * BlogNews to actually read published posts from here is a follow-up, not
 * done in this patch, so drafting/publishing here does not yet change what
 * the public page shows.
 */
export function OwnerContentConsole() {
  const [posts, setPosts] = useState(() => listOwnerContent())
  const [type, setType] = useState<OwnerContentType>('news')
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [coverImage, setCoverImage] = useState('')
  const [tags, setTags] = useState('')
  const [audience, setAudience] = useState<OwnerContentAudience>('public')
  const [scheduledFor, setScheduledFor] = useState('')
  const [authorLabel, setAuthorLabel] = useState('')

  function refresh() {
    setPosts(listOwnerContent())
  }

  function saveDraft() {
    if (!title.trim() || !body.trim() || !authorLabel.trim()) return
    createOwnerContentDraft({
      type,
      title: title.trim(),
      body: body.trim(),
      coverImage: coverImage.trim(),
      tags: tags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean),
      audience,
      scheduledFor: scheduledFor || null,
      authorId: authorLabel.trim().toLowerCase().replace(/\s+/g, '-'),
      authorLabel: authorLabel.trim(),
    })
    setTitle('')
    setBody('')
    setCoverImage('')
    setTags('')
    setScheduledFor('')
    refresh()
  }

  return (
    <div className="min-h-screen bg-bg text-text-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <InternalNav />
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · Content</div>
        <h1 className="text-lg font-semibold">Owner Content Console</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Draft, schedule, and publish news, blog posts, and announcements. Staff-only (§3.4).
        </p>
      </header>

      <main id="main" className="mx-auto grid max-w-5xl gap-8 px-6 py-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-text-0">New post</h2>
          <Field label="Type">
            <SelectInput value={type} onChange={(e) => setType(e.target.value as OwnerContentType)}>
              {TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Title">
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Post title" />
          </Field>
          <Field label="Body">
            <textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              rows={6}
              placeholder="Write the post body"
              className="min-h-[120px] rounded-lg border border-border-strong bg-surface px-3 py-2 text-sm text-text-0 outline-none focus-visible:border-accent"
            />
          </Field>
          <Field label="Cover image URL" hint="Optional">
            <TextInput value={coverImage} onChange={(e) => setCoverImage(e.target.value)} placeholder="https://..." />
          </Field>
          <Field label="Tags" hint="Comma-separated, optional">
            <TextInput value={tags} onChange={(e) => setTags(e.target.value)} placeholder="product, community" />
          </Field>
          <Field label="Audience">
            <SelectInput value={audience} onChange={(e) => setAudience(e.target.value as OwnerContentAudience)}>
              {AUDIENCES.map((a) => (
                <option key={a} value={a}>
                  {a.replace('_', ' ')}
                </option>
              ))}
            </SelectInput>
          </Field>
          <Field label="Schedule for" hint="Optional — leave blank to save as a draft">
            <TextInput type="datetime-local" value={scheduledFor} onChange={(e) => setScheduledFor(e.target.value)} />
          </Field>
          <Field label="Author name">
            <TextInput value={authorLabel} onChange={(e) => setAuthorLabel(e.target.value)} placeholder="Your name" />
          </Field>
          <button
            onClick={saveDraft}
            disabled={!title.trim() || !body.trim() || !authorLabel.trim()}
            className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Save draft
          </button>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-text-0">All posts</h2>
          {posts.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No posts drafted yet — nothing has been written here, so the public Blog &amp; News page's empty state
              is accurate, not a bug.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {posts.map((p) => (
                <div key={p.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <span className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase text-text-2">
                      {p.type} · {p.status}
                    </span>
                    <span className="text-xs text-text-2">{p.authorLabel}</span>
                  </div>
                  <p className="mb-1 font-semibold text-text-0">{p.title}</p>
                  <p className="mb-2 line-clamp-2 text-xs text-text-1">{p.body}</p>
                  <div className="flex gap-3 text-xs">
                    {p.status !== 'published' && (
                      <button
                        onClick={() => {
                          publishOwnerContent(p.id)
                          refresh()
                        }}
                        className="font-semibold text-accent"
                      >
                        Publish now
                      </button>
                    )}
                    <button
                      onClick={() => {
                        deleteOwnerContent(p.id)
                        refresh()
                      }}
                      className="font-semibold text-danger"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
