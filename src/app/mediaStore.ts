import { getAccountImages, setAccountImage } from './demoAccountStore'

/**
 * Profile photo and cover live on the account row (server-side, readable by
 * every user and device); this module is the thin upload/read facade over it.
 * Images are downscaled client-side (resizeImage) before upload.
 */
export interface ProfileMedia {
  avatarDataUrl: string | null
  coverDataUrl: string | null
}

export function getProfileMedia(ownerEmail: string): ProfileMedia {
  const { avatarUrl, coverUrl } = getAccountImages(ownerEmail)
  return { avatarDataUrl: avatarUrl, coverDataUrl: coverUrl }
}

export function saveAvatar(ownerEmail: string, dataUrl: string): Promise<void> {
  return setAccountImage(ownerEmail, 'avatar', dataUrl)
}

export function saveCover(ownerEmail: string, dataUrl: string): Promise<void> {
  return setAccountImage(ownerEmail, 'cover', dataUrl)
}

export type MediaUploadError = 'not_an_image' | 'too_large' | 'read_failed'

/** Resizes/re-encodes an uploaded image client-side (max dimensions + JPEG
 * quality) so it fits a realistic localStorage quota, and rejects anything
 * that isn't actually an image or is absurdly large before even trying. */
export function resizeImage(file: File, maxDimension: number): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith('image/')) {
      reject('not_an_image' as MediaUploadError)
      return
    }
    if (file.size > 15 * 1024 * 1024) {
      reject('too_large' as MediaUploadError)
      return
    }
    const reader = new FileReader()
    reader.onerror = () => reject('read_failed' as MediaUploadError)
    reader.onload = () => {
      const img = new Image()
      img.onerror = () => reject('read_failed' as MediaUploadError)
      img.onload = () => {
        const scale = Math.min(1, maxDimension / Math.max(img.width, img.height))
        const canvas = document.createElement('canvas')
        canvas.width = Math.round(img.width * scale)
        canvas.height = Math.round(img.height * scale)
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject('read_failed' as MediaUploadError)
          return
        }
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
        resolve(canvas.toDataURL('image/jpeg', 0.85))
      }
      img.src = reader.result as string
    }
    reader.readAsDataURL(file)
  })
}
