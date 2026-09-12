/**
 * Temporary client-only scaffolding, same caveats as demoAccountStore.ts —
 * no real object storage exists yet, so uploaded images are resized
 * client-side and persisted as data URLs in localStorage, keyed by owner.
 * This is a real pipeline (upload → resize → preview → persist → survive
 * refresh/logout-login within this browser), not a decorative button: the
 * full chain data-model.md's `IndividualProfile.photo`/`cover` fields imply
 * was previously entirely missing (no upload handler existed anywhere).
 *
 * localStorage has a real ~5-10MB per-origin quota, so images are always
 * downscaled (resizeImage below) before storing — an unresized phone photo
 * would blow the quota after a handful of uploads.
 */
export interface ProfileMedia {
  avatarDataUrl: string | null
  coverDataUrl: string | null
}

const STORAGE_KEY = 'profile:demo-media'

function readAll(): Record<string, ProfileMedia> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, ProfileMedia>) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
}

const DEFAULTS: ProfileMedia = { avatarDataUrl: null, coverDataUrl: null }

export function getProfileMedia(ownerEmail: string): ProfileMedia {
  return readAll()[ownerEmail] ?? DEFAULTS
}

export function saveAvatar(ownerEmail: string, dataUrl: string): void {
  const all = readAll()
  all[ownerEmail] = { ...(all[ownerEmail] ?? DEFAULTS), avatarDataUrl: dataUrl }
  writeAll(all)
  window.dispatchEvent(new Event('profile-media-changed'))
}

export function saveCover(ownerEmail: string, dataUrl: string): void {
  const all = readAll()
  all[ownerEmail] = { ...(all[ownerEmail] ?? DEFAULTS), coverDataUrl: dataUrl }
  writeAll(all)
  window.dispatchEvent(new Event('profile-media-changed'))
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
