import { useRef, useState } from 'react'
import { resizeImage, type MediaUploadError } from '@/app/mediaStore'
import { ProfileLogoAnimated } from './ProfileLogoAnimated'

const ERROR_MESSAGE: Record<MediaUploadError, string> = {
  not_an_image: "That file isn't an image.",
  too_large: 'That file is too large (max 15MB).',
  read_failed: "Couldn't read that file — try a different one.",
}

/** Real upload → resize → preview → persist pipeline (mediaStore.ts) — used
 * for both avatar and cover uploads. `shape` only changes the preview's CSS,
 * the pipeline is identical. */
export function ImageUploadField({
  label,
  value,
  maxDimension,
  shape,
  onUploaded,
}: {
  label: string
  value: string | null
  maxDimension: number
  shape: 'circle' | 'banner'
  onUploaded: (dataUrl: string) => void
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle')
  const [error, setError] = useState<string | null>(null)

  async function handleFile(file: File) {
    setStatus('loading')
    setError(null)
    try {
      const dataUrl = await resizeImage(file, maxDimension)
      onUploaded(dataUrl)
      setStatus('success')
      setTimeout(() => setStatus('idle'), 1500)
    } catch (err) {
      setStatus('error')
      setError(ERROR_MESSAGE[err as MediaUploadError] ?? 'Upload failed.')
    }
  }

  const previewClass = shape === 'circle' ? 'h-20 w-20 rounded-full object-cover' : 'h-24 w-full rounded-lg object-cover'

  return (
    <div>
      <div className="mb-1.5 text-xs font-medium text-text-0">{label}</div>
      <div className="flex items-center gap-3">
        {status === 'loading' || status === 'error' || status === 'success' ? (
          <div className={`flex items-center justify-center ${shape === 'circle' ? 'h-20 w-20 rounded-full' : 'h-24 w-full rounded-lg'} bg-surface-sunken`}>
            <ProfileLogoAnimated state={status} size={28} />
          </div>
        ) : value ? (
          <img src={value} alt="" className={previewClass} />
        ) : (
          <div className={`flex items-center justify-center ${shape === 'circle' ? 'h-20 w-20 rounded-full' : 'h-24 w-full rounded-lg'} border border-dashed border-border-strong bg-surface-sunken text-xs text-text-2`}>
            No image
          </div>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="flex-none rounded-lg border border-border-strong bg-surface px-3 py-2 text-xs font-semibold text-text-0"
        >
          {value ? 'Change' : 'Upload'}
        </button>
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0]
            if (file) handleFile(file)
            e.target.value = ''
          }}
        />
      </div>
      {error && <p className="mt-1.5 text-xs text-danger">{error}</p>}
    </div>
  )
}
