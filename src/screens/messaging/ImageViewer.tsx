import { useEffect, useState } from 'react'
import { getAttachmentUrl, type MessageAttachment } from '@/app/messageStore'

/** Full-screen viewer: loads the 1600px preview (not the original), zoom, and
 * a download link for the untouched original. Esc / backdrop click closes. */
export function ImageViewer({ attachment, onClose }: { attachment: MessageAttachment; onClose: () => void }) {
  const [src, setSrc] = useState<string | null>(null)
  const [original, setOriginal] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)

  useEffect(() => {
    let live = true
    getAttachmentUrl(attachment, 'preview').then((u) => live && setSrc(u))
    getAttachmentUrl(attachment, 'original').then((u) => live && setOriginal(u))
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
      if (e.key === '+' || e.key === '=') setZoom((z) => Math.min(4, z + 0.5))
      if (e.key === '-') setZoom((z) => Math.max(1, z - 0.5))
    }
    window.addEventListener('keydown', onKey)
    return () => {
      live = false
      window.removeEventListener('keydown', onKey)
    }
  }, [attachment, onClose])

  return (
    <div role="dialog" aria-modal="true" aria-label={attachment.fileName} onClick={onClose} className="fixed inset-0 z-[300] flex flex-col bg-black/90">
      <div className="flex items-center justify-between gap-3 p-3 text-white" onClick={(e) => e.stopPropagation()}>
        <span className="min-w-0 truncate text-sm">{attachment.fileName}</span>
        <div className="flex flex-none items-center gap-2 text-sm">
          <button onClick={() => setZoom((z) => Math.max(1, z - 0.5))} className="rounded-md border border-white/30 px-2.5 py-1" aria-label="Zoom out">
            −
          </button>
          <button onClick={() => setZoom((z) => Math.min(4, z + 0.5))} className="rounded-md border border-white/30 px-2.5 py-1" aria-label="Zoom in">
            +
          </button>
          {original && (
            <a href={original} download={attachment.fileName} target="_blank" rel="noopener noreferrer" className="rounded-md border border-white/30 px-2.5 py-1 text-white no-underline">
              Download
            </a>
          )}
          <button onClick={onClose} className="rounded-md border border-white/30 px-2.5 py-1" aria-label="Close viewer">
            ✕
          </button>
        </div>
      </div>
      <div className="flex min-h-0 flex-1 items-center justify-center overflow-auto p-3" onClick={(e) => e.stopPropagation()}>
        {src ? (
          <img src={src} alt={attachment.fileName} style={{ transform: `scale(${zoom})`, transformOrigin: 'center', transition: 'transform 120ms' }} className="max-h-full max-w-full object-contain" />
        ) : (
          <span className="text-sm text-white/80">Loading…</span>
        )}
      </div>
    </div>
  )
}
