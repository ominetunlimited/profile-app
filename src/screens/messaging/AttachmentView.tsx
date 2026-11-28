import { useEffect, useState } from 'react'
import { getAttachmentUrl, type MessageAttachment } from '@/app/messageStore'
import { useRef } from 'react'
import { ImageViewer } from './ImageViewer'
import { CAudio, CDownload, CFile, CPause, CPdf, CPlay, CZip } from './chatIcons'

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
      <button type="button" onClick={() => setOpen(true)} className="block overflow-hidden rounded-2xl bg-black/10" style={{ aspectRatio: ratio, width: 240, maxWidth: '100%' }} aria-label={`Open image ${attachment.fileName}`}>
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

function fmtTime(n: number): string {
  return `${Math.floor(n / 60)}:${String(Math.floor(n % 60)).padStart(2, '0')}`
}

function AudioAttachment({ attachment }: { attachment: MessageAttachment }) {
  const { url, failed } = useSignedUrl(attachment, 'original')
  const ref = useRef<HTMLAudioElement>(null)
  const [playing, setPlaying] = useState(false)
  const [pos, setPos] = useState(0)
  const [dur, setDur] = useState(attachment.durationSeconds ?? 0)
  if (failed) return <span className="flex w-[240px] max-w-full items-center gap-2 text-xs"><CAudio size={16} /> Audio unavailable</span>
  return (
    <div className="flex w-[250px] max-w-full items-center gap-3 py-0.5">
      <audio
        ref={ref}
        src={url ?? undefined}
        preload="metadata"
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
        onEnded={() => { setPlaying(false); setPos(0) }}
        onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)}
        onLoadedMetadata={(e) => Number.isFinite(e.currentTarget.duration) && setDur(e.currentTarget.duration)}
      />
      <button type="button" disabled={!url} onClick={() => (playing ? ref.current?.pause() : void ref.current?.play())} aria-label={playing ? 'Pause voice message' : 'Play voice message'} className="flex h-10 w-10 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,currentColor_15%,transparent)] disabled:opacity-50">
        {playing ? <CPause size={18} /> : <CPlay size={18} />}
      </button>
      <div className="min-w-0 flex-1">
        <div className="relative h-1.5 rounded-full bg-[color-mix(in_srgb,currentColor_20%,transparent)]">
          <div className="absolute inset-y-0 start-0 rounded-full bg-current" style={{ width: dur ? `${Math.min(100, (pos / dur) * 100)}%` : '0%' }} />
        </div>
        <div className="mt-1 text-[10.5px] opacity-75">{fmtTime(playing || pos > 0 ? pos : dur)}{!url && ' · loading'}</div>
      </div>
    </div>
  )
}

function FileAttachment({ attachment }: { attachment: MessageAttachment }) {
  const { url, failed } = useSignedUrl(attachment, 'original')
  const Icon = attachment.category === 'pdf' ? CPdf : attachment.category === 'zip' ? CZip : CFile
  return (
    <a href={url ?? undefined} download={attachment.fileName} target="_blank" rel="noopener noreferrer" aria-disabled={!url} className="flex w-[250px] max-w-full items-center gap-3 rounded-2xl bg-[color-mix(in_srgb,currentColor_10%,transparent)] p-2.5 text-inherit no-underline">
      <span className="flex h-11 w-11 flex-none items-center justify-center rounded-xl bg-[color-mix(in_srgb,currentColor_15%,transparent)]"><Icon size={22} /></span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-[13px] font-semibold">{attachment.fileName}</span>
        <span className="block text-[11px] opacity-75">{failed ? 'Unavailable' : formatBytes(attachment.sizeBytes)}</span>
      </span>
      <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[color-mix(in_srgb,currentColor_15%,transparent)]"><CDownload size={16} /></span>
    </a>
  )
}
