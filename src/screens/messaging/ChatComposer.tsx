import { useEffect, useRef, useState } from 'react'
import { sendMessage, type AttachmentInput, type ChatMessage } from '@/app/messageStore'
import { CameraCapture } from '@/shared/ui/CameraCapture'
import { CAttach, CBold, CCamera, CClose, CFile, CImage, CItalic, CList, CMic, CQuote, CSend, CStop, CTrash } from './chatIcons'
import { ChatMenu, MenuItem } from './ChatMenu'
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
  const [cameraOpen, setCameraOpen] = useState(false)
  const [recording, setRecording] = useState<{ startedAt: number } | null>(null)
  const [elapsed, setElapsed] = useState(0)
  const [attachOpen, setAttachOpen] = useState(false)
  const [fmtOpen, setFmtOpen] = useState(false)
  const discardRef = useRef(false)
  const photoRef = useRef<HTMLInputElement>(null)
  const fileRef = useRef<HTMLInputElement>(null)
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
        if (discardRef.current) { discardRef.current = false; return }
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
  function cancelRecording() {
    discardRef.current = true
    recorderRef.current?.stop()
    setRecording(null)
  }
  const canSend = !busy && (draft.trim().length > 0 || staged.length > 0)

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
    <div className="bg-surface px-3 pb-3 pt-2 md:px-4">
      {error && <p role="alert" className="mb-1.5 px-2 text-xs text-danger">{error}</p>}
      {progress && <p className="mb-1.5 px-2 text-xs text-text-2">{progress}</p>}

      <div className="rounded-3xl border border-border bg-surface shadow-sm transition-shadow focus-within:border-accent focus-within:shadow-md">
        {replyTo && (
          <div className="mx-2 mt-2 flex items-start justify-between gap-2 rounded-2xl border-s-[3px] border-accent bg-accent-soft px-3 py-2 text-xs">
            <div className="min-w-0">
              <div className="font-bold text-accent">Replying to {displayName(replyTo.senderEmail)}</div>
              <div className="truncate text-text-1">{replyTo.text || 'Attachment'}</div>
            </div>
            <button onClick={onCancelReply} aria-label="Cancel reply" className="flex h-6 w-6 flex-none items-center justify-center rounded-full text-text-2 hover:bg-surface-sunken hover:text-text-0"><CClose size={14} /></button>
          </div>
        )}

        {staged.length > 0 && (
          <div className="flex flex-wrap gap-2 px-3 pt-3">
            {staged.map((st) => (
              <div key={st.key} className="group relative">
                {st.previewUrl ? (
                  <img src={st.previewUrl} alt="" className="h-16 w-16 rounded-xl object-cover" />
                ) : (
                  <div className="flex h-16 max-w-[190px] items-center gap-2 rounded-xl bg-surface-sunken px-3 text-xs">
                    <span className="flex h-9 w-9 flex-none items-center justify-center rounded-lg bg-accent-soft text-accent">{st.input.category === 'audio' ? <CMic size={18} /> : <CFile size={18} />}</span>
                    <span className="truncate font-medium text-text-0">{st.input.fileName}</span>
                  </div>
                )}
                <button onClick={() => { if (st.previewUrl) URL.revokeObjectURL(st.previewUrl); setStaged((p) => p.filter((x) => x.key !== st.key)) }} aria-label={`Remove ${st.input.fileName}`} className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-text-0 text-surface shadow"><CClose size={12} /></button>
              </div>
            ))}
          </div>
        )}

        {recording ? (
          <div className="flex items-center gap-3 px-3 py-2.5">
            <button onClick={cancelRecording} aria-label="Discard recording" className="flex h-10 w-10 flex-none items-center justify-center rounded-full text-danger hover:bg-danger-soft"><CTrash size={20} /></button>
            <span className="h-2.5 w-2.5 flex-none animate-pulse rounded-full bg-danger" />
            <span className="w-12 flex-none font-mono text-sm text-text-0">{Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, '0')}</span>
            <div className="flex h-8 flex-1 items-center gap-[3px] overflow-hidden" aria-hidden="true">
              {Array.from({ length: 36 }).map((_, i) => (
                <span key={i} className="w-[3px] flex-none rounded-full bg-accent/60 motion-safe:animate-pulse" style={{ height: `${25 + ((i * 37) % 70)}%`, animationDelay: `${(i % 9) * 90}ms` }} />
              ))}
            </div>
            <button onClick={stopRecording} aria-label="Stop and attach recording" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-solid text-white"><CStop size={18} /></button>
          </div>
        ) : (
          <>
            {fmtOpen && (
              <div className="flex items-center gap-1 px-3 pt-2.5">
                {[
                  { l: 'Bold', i: <CBold size={16} />, f: () => wrap('*') },
                  { l: 'Italic', i: <CItalic size={16} />, f: () => wrap('_') },
                  { l: 'Bulleted list', i: <CList size={16} />, f: () => prefixLines('- ') },
                  { l: 'Quote', i: <CQuote size={16} />, f: () => prefixLines('> ') },
                ].map((b) => (
                  <button key={b.l} type="button" onClick={b.f} aria-label={b.l} title={b.l} className="flex h-8 w-8 items-center justify-center rounded-lg text-text-1 hover:bg-surface-sunken hover:text-text-0">{b.i}</button>
                ))}
              </div>
            )}
            <div className="flex items-end gap-1 px-2 py-2">
              <div className="relative flex-none">
                <button type="button" onClick={() => setAttachOpen((v) => !v)} aria-label="Attach" aria-haspopup="menu" aria-expanded={attachOpen} title="Attach" className={`flex h-10 w-10 items-center justify-center rounded-full transition-colors hover:bg-surface-sunken ${attachOpen ? 'bg-surface-sunken text-accent' : 'text-text-1'}`}><CAttach size={21} /></button>
                <ChatMenu open={attachOpen} onClose={() => setAttachOpen(false)} align="left" up label="Attach">
                  <MenuItem icon={<CImage size={18} />} onClick={() => { setAttachOpen(false); photoRef.current?.click() }}>Photo</MenuItem>
                  <MenuItem icon={<CCamera size={18} />} onClick={() => { setAttachOpen(false); setCameraOpen(true) }}>Camera</MenuItem>
                  <MenuItem icon={<CFile size={18} />} onClick={() => { setAttachOpen(false); fileRef.current?.click() }}>Document</MenuItem>
                </ChatMenu>
                <input ref={photoRef} type="file" multiple accept="image/*" className="sr-only" tabIndex={-1} onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = '' }} />
                <input ref={fileRef} type="file" multiple accept={CHAT_ACCEPT} className="sr-only" tabIndex={-1} onChange={(e) => { if (e.target.files) void addFiles(e.target.files); e.target.value = '' }} />
              </div>
              <textarea
                ref={textRef}
                value={draft}
                rows={1}
                onChange={(e) => { setDraft(e.target.value); emitTyping(e.target.value.length > 0) }}
                onBlur={() => emitTyping(false)}
                onKeyDown={(e) => {
                  // Desktop: Enter sends, Shift+Enter = newline. Touch devices: Enter = newline (use the Send button).
                  if (e.key === 'Enter' && !e.shiftKey && !isCoarsePointer() && !e.nativeEvent.isComposing) { e.preventDefault(); send() }
                }}
                onPaste={(e) => { const files = Array.from(e.clipboardData.files); if (files.length) { e.preventDefault(); void addFiles(files) } }}
                placeholder="Write a message…"
                aria-label="Write a message"
                className="max-h-40 min-h-[40px] flex-1 resize-none bg-transparent px-2 py-2.5 text-[14.5px] leading-snug text-text-0 outline-none placeholder:text-text-2"
              />
              <button type="button" onClick={() => setFmtOpen((v) => !v)} aria-label="Text formatting" aria-pressed={fmtOpen} title="Formatting" className={`flex h-10 w-10 flex-none items-center justify-center rounded-full text-[15px] font-bold transition-colors hover:bg-surface-sunken ${fmtOpen ? 'text-accent' : 'text-text-1'}`}>Aa</button>
              {canSend ? (
                <button type="button" onClick={() => send()} aria-label="Send message" title="Send" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-solid text-white shadow-sm transition-transform hover:scale-105 active:scale-95"><CSend size={19} className="-translate-x-px translate-y-px" /></button>
              ) : (
                <button type="button" onClick={startRecording} disabled={busy} aria-label="Record a voice message" title="Voice message" className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-accent-solid text-white shadow-sm transition-transform hover:scale-105 active:scale-95 disabled:opacity-40"><CMic size={19} /></button>
              )}
            </div>
          </>
        )}
      </div>
      <CameraCapture open={cameraOpen} onClose={() => setCameraOpen(false)} onCapture={(f) => void addFiles([f])} title="Take a photo" guide="none" />
    </div>
  )
}
