import { useEffect, useState } from 'react'
import { getAttachmentUrl, type MessageAttachment } from '@/app/messageStore'
import { ImageViewer } from './ImageViewer'

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(0)} KB`
  return `${(n / (1024 * 1024)).toFixed(1)} MB`
}

function useSignedUrl(att: MessageAttachment, variant: 'original' | 'preview' | 'thumb') {
  const [url, setUrl] = useState<string | null>(null)
  const [failed, setFailed] = useState(false)
  useEffect(() => {
    let live = true
    getAttachmentUrl(att, variant).then((u) => {
      if (!live) return
      if (u) setUrl(u)
      else setFailed(true)
    })
    return () => {
      live = false
    }
  }, [att, variant])
  return { url, failed }
}

export function AttachmentView({ attachment }: { attachment: MessageAttachment }) {
  if (attachment.category === 'image') return <ImageAttachment attachment={attachment} />
  if (attachment.category === 'audio') return <AudioAttachment attachment={attachment} />
  return <FileAttachment attachment={attachment} />
}

function ImageAttachment({ attachment }: { attachment: MessageAttachment }) {
  const { url, failed } = useSignedUrl(attachment, 'thumb')
  const [open, setOpen] = useState(false)
  // Reserve the real aspect ratio up front so the thread doesn't jump as images load.
  const ratio = attachment.width && attachment.height ? `${attachment.width} / ${attachment.height}` : '4 / 3'
  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="block overflow-hidden rounded-lg bg-black/10" style={{ aspectRatio: ratio, width: 240, maxWidth: '100%' }} aria-label={`Open image ${attachment.fileName}`}>
        {failed ? (
          <span className="flex h-full items-center justify-center text-xs">Image unavailable</span>
        ) : url ? (
          <img src={url} alt={attachment.fileName} loading="lazy" decoding="async" className="h-full w-full object-cover" />
        ) : (
          <span className="block h-full w-full animate-pulse bg-black/10" />
        )}
      </button>
      {open && <ImageViewer attachment={attachment} onClose={() => setOpen(false)} />}
    </>
  )
}

function AudioAttachment({ attachment }: { attachment: MessageAttachment }) {
  const { url, failed } = useSignedUrl(attachment, 'original')
  const mins = attachment.durationSeconds ? `${Math.floor(attachment.durationSeconds / 60)}:${String(Math.round(attachment.durationSeconds % 60)).padStart(2, '0')}` : null
  return (
    <div className="w-[240px] max-w-full">
      {failed ? (
        <span className="text-xs">Audio unavailable</span>
      ) : url ? (
        <audio controls preload="none" src={url} className="h-10 w-full" />
      ) : (
        <span className="text-xs">Loading audio…</span>
      )}
      <div className="mt-0.5 text-[10.5px] opacity-70">
        {attachment.fileName}
        {mins ? ` · ${mins}` : ''}
      </div>
    </div>
  )
}

function FileAttachment({ attachment }: { attachment: MessageAttachment }) {
  const { url, failed } = useSignedUrl(attachment, 'original')
  const label = attachment.category === 'pdf' ? 'PDF' : attachment.category === 'zip' ? 'ZIP' : 'FILE'
  return (
    <a
      href={url ?? undefined}
      download={attachment.fileName}
      target="_blank"
      rel="noopener noreferrer"
      aria-disabled={!url}
      className="flex w-[240px] max-w-full items-center gap-2.5 rounded-lg bg-black/10 p-2.5 no-underline"
    >
      <span className="flex h-9 w-9 flex-none items-center justify-center rounded-md bg-black/15 text-[10px] font-bold">{label}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-semibold">{attachment.fileName}</span>
        <span className="block text-[10.5px] opacity-70">{failed ? 'Unavailable' : `${formatBytes(attachment.sizeBytes)} · tap to download`}</span>
      </span>
    </a>
  )
}
