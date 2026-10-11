import { useCallback, useEffect, useRef, useState } from 'react'
import { IconClose } from './icons'

/**
 * Live camera capture for mobile and desktop (webcam). Uses getUserMedia with
 * the rear camera for documents / front camera for selfies, a framing guide,
 * retake/confirm, and graceful fallbacks: when the camera is blocked,
 * missing, or the page isn't a secure context, the user can still pick a photo
 * or open their phone's own camera app via <input capture>.
 */
export function CameraCapture({
  open,
  onClose,
  onCapture,
  facing = 'environment',
  title = 'Take a photo',
  hint,
  guide = 'document',
}: {
  open: boolean
  onClose: () => void
  onCapture: (file: File) => void
  facing?: 'user' | 'environment'
  title?: string
  hint?: string
  guide?: 'document' | 'face' | 'none'
}) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const streamRef = useRef<MediaStream | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [ready, setReady] = useState(false)
  const [mode, setMode] = useState<'user' | 'environment'>(facing)
  const [cameraCount, setCameraCount] = useState(0)
  const [shot, setShot] = useState<{ blob: Blob; url: string } | null>(null)

  const stop = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    setReady(false)
  }, [])

  useEffect(() => {
    if (!open) return
    setMode(facing)
    setShot(null)
  }, [open, facing])

  useEffect(() => {
    if (!open || shot) return
    let cancelled = false
    setError(null)
    setReady(false)
    ;(async () => {
      if (!navigator.mediaDevices?.getUserMedia) {
        setError(window.isSecureContext ? "This browser can't access a camera." : 'Camera access needs a secure (HTTPS) connection.')
        return
      }
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: { ideal: mode }, width: { ideal: 1920 }, height: { ideal: 1080 } },
          audio: false,
        })
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream
        const video = videoRef.current
        if (video) {
          video.srcObject = stream
          await video.play().catch(() => {})
        }
        setReady(true)
        const devices = await navigator.mediaDevices.enumerateDevices().catch(() => [])
        if (!cancelled) setCameraCount(devices.filter((d) => d.kind === 'videoinput').length)
      } catch (e) {
        const name = (e as { name?: string }).name
        setError(
          name === 'NotAllowedError' || name === 'SecurityError'
            ? 'Camera permission was blocked. Allow camera access in your browser, or choose a photo instead.'
            : name === 'NotFoundError' || name === 'OverconstrainedError'
              ? 'No camera was found on this device. You can choose a photo instead.'
              : 'The camera could not be started. You can choose a photo instead.',
        )
      }
    })()
    return () => {
      cancelled = true
      stop()
    }
  }, [open, mode, shot, stop])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  useEffect(() => {
    return () => {
      if (shot) URL.revokeObjectURL(shot.url)
    }
  }, [shot])

  if (!open) return null

  function snap() {
    const video = videoRef.current
    if (!video || !video.videoWidth) return
    const canvas = document.createElement('canvas')
    canvas.width = video.videoWidth
    canvas.height = video.videoHeight
    canvas.getContext('2d')?.drawImage(video, 0, 0)
    canvas.toBlob(
      (blob) => {
        if (!blob) return
        stop()
        setShot({ blob, url: URL.createObjectURL(blob) })
      },
      'image/jpeg',
      0.92,
    )
  }

  function usePhoto() {
    if (!shot) return
    onCapture(new File([shot.blob], `capture-${Date.now()}.jpg`, { type: 'image/jpeg' }))
    onClose()
  }

  function fromFile(files: FileList | null) {
    const f = files?.[0]
    if (!f) return
    onCapture(f)
    onClose()
  }

  return (
    <div role="dialog" aria-modal="true" aria-label={title} className="fixed inset-0 z-[400] flex flex-col bg-black">
      <div className="flex items-center justify-between gap-3 p-3 text-white">
        <div className="min-w-0">
          <div className="truncate text-sm font-semibold">{title}</div>
          {hint && <div className="text-xs text-white/70">{hint}</div>}
        </div>
        <button onClick={onClose} className="flex items-center rounded-md border border-white/30 px-2 py-1 text-sm" aria-label="Close camera">
          <IconClose size={16} />
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center overflow-hidden">
        {shot ? (
          <img src={shot.url} alt="Captured photo preview" className="max-h-full max-w-full object-contain" />
        ) : error ? (
          <div className="mx-auto max-w-sm p-6 text-center text-sm text-white">
            <p role="alert" className="mb-4">{error}</p>
          </div>
        ) : (
          <>
            <video ref={videoRef} playsInline muted autoPlay aria-label="Camera preview" className="h-full w-full object-contain" style={mode === 'user' ? { transform: 'scaleX(-1)' } : undefined} />
            {guide === 'document' && ready && <div className="pointer-events-none absolute inset-x-[7%] top-1/2 aspect-[1.586] max-h-[70%] -translate-y-1/2 rounded-xl border-2 border-dashed border-white/80" aria-hidden />}
            {guide === 'face' && ready && <div className="pointer-events-none absolute left-1/2 top-1/2 h-[62%] aspect-[3/4] -translate-x-1/2 -translate-y-1/2 rounded-[50%] border-2 border-dashed border-white/80" aria-hidden />}
            {!ready && <p className="absolute text-sm text-white/80">Starting camera…</p>}
          </>
        )}
      </div>

      <div className="flex flex-wrap items-center justify-center gap-3 p-4">
        {shot ? (
          <>
            <button onClick={() => setShot(null)} className="rounded-lg border border-white/40 px-4 py-2.5 text-sm font-semibold text-white">
              Retake
            </button>
            <button onClick={usePhoto} className="rounded-lg bg-white px-5 py-2.5 text-sm font-semibold text-black">
              Use this photo
            </button>
          </>
        ) : (
          <>
            {!error && (
              <button onClick={snap} disabled={!ready} aria-label="Take photo" className="h-14 w-14 rounded-full border-4 border-white bg-white/20 disabled:opacity-40">
                <span className="sr-only">Take photo</span>
              </button>
            )}
            {!error && cameraCount > 1 && (
              <button onClick={() => setMode((m) => (m === 'user' ? 'environment' : 'user'))} className="rounded-lg border border-white/40 px-3 py-2 text-xs font-semibold text-white">
                Switch camera
              </button>
            )}
            <label className="cursor-pointer rounded-lg border border-white/40 px-3 py-2 text-xs font-semibold text-white">
              {error ? 'Choose a photo / open camera app' : 'Choose a photo instead'}
              <input type="file" accept="image/*" capture={facing} className="sr-only" aria-label="Choose a photo or use your device camera app" onChange={(e) => { fromFile(e.target.files); e.target.value = '' }} />
            </label>
          </>
        )}
      </div>
    </div>
  )
}
