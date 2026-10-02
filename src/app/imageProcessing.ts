/**
 * Optimised viewing variants for images. Re-encoding through a canvas applies
 * EXIF orientation and strips all metadata (GPS etc.) from the variants; the
 * untouched original is still stored separately for authorised download.
 */
export interface ImageVariants {
  preview: Blob
  thumb: Blob
  width: number
  height: number
}

async function encode(bitmap: ImageBitmap, maxSide: number, quality: number): Promise<Blob> {
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const w = Math.max(1, Math.round(bitmap.width * scale))
  const h = Math.max(1, Math.round(bitmap.height * scale))
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas unavailable')
  ctx.drawImage(bitmap, 0, 0, w, h)
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality))
  if (blob && blob.type === 'image/webp') return blob
  const jpeg = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/jpeg', quality))
  if (!jpeg) throw new Error('Could not encode image')
  return jpeg
}

/** Returns null for animated GIFs (variants would freeze them) — callers fall back to the original. */
export async function makeImageVariants(file: File): Promise<ImageVariants | null> {
  if (file.type === 'image/gif') return null
  const bitmap = await createImageBitmap(file, { imageOrientation: 'from-image' })
  try {
    const [preview, thumb] = await Promise.all([encode(bitmap, 1600, 0.82), encode(bitmap, 320, 0.7)])
    return { preview, thumb, width: bitmap.width, height: bitmap.height }
  } finally {
    bitmap.close()
  }
}

export function audioDurationSeconds(file: Blob): Promise<number | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file)
    const audio = new Audio()
    const done = (v: number | null) => {
      URL.revokeObjectURL(url)
      resolve(v)
    }
    audio.preload = 'metadata'
    audio.onloadedmetadata = () => done(Number.isFinite(audio.duration) ? audio.duration : null)
    audio.onerror = () => done(null)
    audio.src = url
  })
}
