import { useEffect, useRef, useState } from 'react'
import { sendMessage, type AttachmentInput, type ChatMessage } from '@/app/messageStore'
import { CHAT_ACCEPT, CHAT_MAX_FILES_PER_MESSAGE, validateChatFile, type ChatFileCategory } from '@/app/fileValidation'

const isCoarsePointer = () => typeof window !== 'undefined' && window.matchMedia?.('(pointer: coarse)').matches

interface Staged {
  key: string
  input: AttachmentInput
  previewUrl: string | null
}

export function ChatComposer({
  ownerEmail,
  conversationId,
  replyTo,
  onCancelReply,
  emitTyping,
  displayName,
}: {
  ownerEmail: string
  conversationId: string
  replyTo: ChatMessage | null
  onCancelReply: () => void
  emitTyping: (typing: boolean) => void
  displayName: (email: string) => string
}) {
  const [draft, setDraft] = useState('')
  const [staged, setStaged] = useState<Staged[]>([])
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [progress, setProgress] = useState<string | null>(null)
  const [recording, setRecording] = useState<{ startedAt: number } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const textRef = useRef<HTMLTextAreaElement>(null)
  const recorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const streamRef = useRef<MediaStream | null>(null)

  // Auto-grow the textarea (capped) so long, multi-paragraph messages stay readable.
  useEffect(() => {
    const el = textRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${Math.min(el.scrollHeight, 160)}px`
  }, [draft])

  useEffect(() => {
    if (!recording) return
    const t = setInterval(() => setElapsed(Math.floor((Date.now() - recording.startedAt) / 1000)), 250)
    return () => clearInterval(t)
  }, [recording])

  useEffect(() => () => streamRef.current?.getTracks().forEach((t) => t.stop()), [])
  useEffect(() => () => staged.forEach((s) => s.previewUrl && URL.revokeObjectURL(s.previewUrl)), []) // eslint-disable-line react-hooks/exhaustive-deps

  function wrap(marker: string) {
    const el = textRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const sel = draft.slice(s, e) || 'text'
    setDraft(`${draft.slice(0, s)}${marker}${sel}${marker}${draft.slice(e)}`)
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(s + marker.length, s + marker.length + sel.length)
    })
  }
  function prefixLines(prefix: string) {
    const el = textRef.current
    if (!el) return
    const { selectionStart: s, selectionEnd: e } = el
    const lineStart = draft.lastIndexOf('\n', s - 1) + 1
    const block = draft.slice(lineStart, e) || ''
    const next = block.split('\n').map((l, i) => (prefix === '1. ' ? `${i + 1}. ${l}` : `${prefix}${l}`)).join('\n')
    setDraft(draft.slice(0, lineStart) + next + draft.slice(e))
    requestAnimationFrame(() => el.focus())
  }

  async function addFiles(files: FileList | File[]) {
    setError(null)
    const list = Array.from(files)
    if (staged.length + list.length > CHAT_MAX_FILES_PER_MESSAGE) {
      setError(`You can attach up to ${CHAT_MAX_FILES_PER_MESSAGE} files per message.`)
      return
    }
    const added: Staged[] = []
    for (const f of list) {
      try {
        const v = await validateChatFile(f)
        added.push({
          key: crypto.randomUUID(),
          input: { file: v.file, fileName: v.file.name, category: v.category },
          previewUrl: v.category === 'image' ? URL.createObjectURL(v.file) : null,
        })
      } catch (err) {
        setError(err instanceof Error ? err.message : 'That file was rejected.')
      }
    }
    if (added.length) setStaged((prev) => [...prev, ...added])
  }

  async function startRecording() {
    setError(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      streamRef.current = stream
      const recorder = new MediaRecorder(stream)
      chunksRef.current = []
      recorder.ondataavailable = (e) => e.data.size && chunksRef.current.push(e.data)
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop())
        const type = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type })
        const ext = type.includes('ogg') ? 'ogg' : type.includes('mp4') ? 'm4a' : 'webm'
        const file = new File([blob], `voice-message.${ext}`, { type })
        try {
          const v = await validateChatFile(file)
          setStaged((prev) => [...prev, { key: crypto.randomUUID(), input: { file: v.file, fileName: v.file.name, category: v.category as ChatFileCategory }, previewUrl: null }])
        } catch (err) {
          setError(err instanceof Error ? err.message : 'Could not use that recording.')
        }
      }
      recorderRef.current = recorder
      recorder.start()
      setRecording({ startedAt: Date.now() })
      setElapsed(0)
    } catch {
      setError('Microphone access was blocked or is unavailable on this device.')
    }
  }
  function stopRecording() {
    recorderRef.current?.stop()
    setRecording(null)
  }

  function send() {
    const text = draft.trim()
    const hasFiles = staged.length > 0
    if ((!text && !hasFiles) || busy) return
    setError(null)
    emitTyping(false)
    const attachments = staged.map((s) => s.input)
    const reply = replyTo?.id ?? null
    // Optimistic: clear immediately and never block the next message on this one.
    // Only an in-flight file upload holds the composer; a failed send shows Retry in the thread.
    setDraft('')
    setStaged([])
    onCancelReply()
    if (hasFiles) setBusy(true)
    sendMessage(conversationId, ownerEmail, text, {
      replyTo: reply,
      attachments,
      onProgress: hasFiles ? (d, t) => setProgress(d < t ? `Uploading ${d + 1}/${t}…` : null) : undefined,
    })
      .catch((err) => {
        const code = (err as { code?: string } | null)?.code
        const message = (err as { message?: string } | null)?.message
        setError(code === '42501' ? "You can't message this person." : code === '54000' ? 'You are sending messages too quickly. Please wait a moment.' : message || 'Message not sent — tap Retry on it.')
      })
      .finally(() => {
        setProgress(null)
        setBusy(false)
      })
    textRef.current?.focus()
  }

  return (
    <div className="border-t border-border p-2.5">
      {replyTo && (
        <div className="mb-2 flex items-start justify-between gap-2 rounded-lg border-s-2 border-accent bg-surface-sunken px-2.5 py-1.5 text-xs">
          <div className="min-w-0">
            <div className="font-semibold text-text-0">Replying to {displayName(replyTo.senderEmail)}</div>
            <div className="truncate text-text-1">{replyTo.text || 'Attachment'}</div>
          </div>
          <button onClick={onCancelReply} aria-label="Cancel reply" className="flex-none text-text-2">
            ✕
          </button>
        </div>
      )}
      {staged.length > 0 && (
        <div className="mb-2 flex flex-wrap gap-2">
          {staged.map((s) => (
            <div key={s.key} className="flex items-center gap-2 rounded-lg border border-border bg-surface-sunken p-1.5 text-xs">
              {s.previewUrl ? <img src={s.previewUrl} alt="" className="h-9 w-9 rounded object-cover" /> : <span className="flex h-9 w-9 items-center justify-center rounded bg-surface text-[10px] font-bold uppercase">{s.input.category}</span>}
              <span className="max-w-[120px] truncate">{s.input.fileName}</span>
              <button onClick={() => { if (s.previewUrl) URL.revokeObjectURL(s.previewUrl); setStaged((p) => p.filter((x) => x.key !== s.key)) }} aria-label={`Remove ${s.input.fileName}`} className="text-text-2">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}
      {error && (
        <p role="alert" className="mb-1.5 text-xs text-danger">
          {error}
        </p>
      )}
      {progress && <p className="mb-1.5 text-xs text-text-2">{progress}</p>}

      {recording ? (
        <div className="flex items-center gap-3 rounded-lg border border-danger bg-surface-sunken px-3 py-2 text-sm">
          <span className="h-2.5 w-2.5 animate-pulse rounded-full bg-danger" />
          <span className="flex-1 font-mono">Recording {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
          <button onClick={stopRecording} className="rounded-lg bg-accent-solid px-3 py-1.5 text-xs font-semibold text-white">
            Stop
          </button>
        </div>
      ) : (
        <>
          <div className="mb-1.5 flex items-center gap-1 text-xs text-text-1">
            <button type="button" onClick={() => wrap('*')} aria-label="Bold" className="rounded px-2 py-1 font-bold hover:bg-surface-sunken">B</button>
            <button type="button" onClick={() => wrap('_')} aria-label="Italic" className="rounded px-2 py-1 italic hover:bg-surface-sunken">I</button>
            <button type="button" onClick={() => prefixLines('- ')} aria-label="Bulleted list" className="rounded px-2 py-1 hover:bg-surface-sunken">• List</button>
            <button type="button" onClick={() => prefixLines('> ')} aria-label="Quote" className="rounded px-2 py-1 hover:bg-surface-sunken">❝ Quote</button>
          </div>
          <div className="flex items-end gap-2">
            <label className="flex h-[42px] w-[42px] flex-none cursor-pointer items-center justify-center rounded-lg border border-border-strong text-lg text-text-1 hover:border-accent" aria-label="Attach files" title="Attach files (images, PDF, ZIP, audio)">
              📎
              <input
                type="file"
                multiple
                accept={CHAT_ACCEPT}
                className="sr-only"
                onChange={(e) => {
                  if (e.target.files) void addFiles(e.target.files)
                  e.target.value = ''
                }}
              />
            </label>
            <button type="button" onClick={startRecording} aria-label="Record a voice message" title="Record a voice message" className="flex h-[42px] w-[42px] flex-none items-center justify-center rounded-lg border border-border-strong text-lg text-text-1 hover:border-accent">
              🎤
            </button>
            <textarea
              ref={textRef}
              value={draft}
              rows={1}
              onChange={(e) => {
                setDraft(e.target.value)
                emitTyping(e.target.value.length > 0)
              }}
              onBlur={() => emitTyping(false)}
              onKeyDown={(e) => {
                // Desktop: Enter sends, Shift+Enter = newline. Touch devices: Enter = newline (use the Send button).
                if (e.key === 'Enter' && !e.shiftKey && !isCoarsePointer() && !e.nativeEvent.isComposing) {
                  e.preventDefault()
                  send()
                }
              }}
              onPaste={(e) => {
                const files = Array.from(e.clipboardData.files)
                if (files.length) {
                  e.preventDefault()
                  void addFiles(files)
                }
              }}
              placeholder="Type a message…"
              aria-label="Type a message…"
              className="max-h-40 min-h-[42px] flex-1 resize-none rounded-lg border border-border-strong bg-surface px-3 py-2.5 text-sm outline-none focus-visible:border-accent"
            />
            <button onClick={() => send()} disabled={busy || (!draft.trim() && staged.length === 0)} className="h-[42px] flex-none rounded-lg bg-accent-solid px-4 text-sm font-semibold text-white disabled:opacity-50">
              Send
            </button>
          </div>
        </>
      )}
    </div>
  )
}
