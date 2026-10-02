/**
 * Chat attachment validation. Never trusts the browser-supplied MIME type or
 * filename alone: the extension, the declared MIME type, and the file's real
 * leading bytes ("magic numbers") must all agree on one allowed category.
 * Honest gap: this is type/size/content-sniff validation, not malware
 * scanning — that needs a third-party scanner this project doesn't have.
 */
export type ChatFileCategory = 'image' | 'audio' | 'pdf' | 'zip'

export const CHAT_MAX_FILE_BYTES = 50 * 1024 * 1024
export const CHAT_MAX_FILES_PER_MESSAGE = 5

// SVG is deliberately excluded: it can carry script. HTML/JS/executables too.
const EXTENSIONS: Record<ChatFileCategory, string[]> = {
  image: ['jpg', 'jpeg', 'png', 'webp', 'gif'],
  audio: ['mp3', 'ogg', 'oga', 'wav', 'webm', 'm4a', 'aac'],
  pdf: ['pdf'],
  zip: ['zip'],
}

export const CHAT_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,audio/*,application/pdf,application/zip,.zip,.pdf,.mp3,.ogg,.wav,.m4a,.webm'

function ext(name: string): string {
  const i = name.lastIndexOf('.')
  return i === -1 ? '' : name.slice(i + 1).toLowerCase()
}

function startsWith(bytes: Uint8Array, sig: number[], offset = 0): boolean {
  return sig.every((b, i) => bytes[offset + i] === b)
}

function ascii(bytes: Uint8Array, start: number, len: number): string {
  return String.fromCharCode(...bytes.slice(start, start + len))
}

/** Category implied by the actual bytes, or null if unrecognised. */
function sniff(bytes: Uint8Array): ChatFileCategory | null {
  if (startsWith(bytes, [0xff, 0xd8, 0xff])) return 'image' // jpeg
  if (startsWith(bytes, [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])) return 'image' // png
  if (ascii(bytes, 0, 4) === 'GIF8') return 'image'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WEBP') return 'image'
  if (ascii(bytes, 0, 5) === '%PDF-') return 'pdf'
  if (startsWith(bytes, [0x50, 0x4b, 0x03, 0x04]) || startsWith(bytes, [0x50, 0x4b, 0x05, 0x06])) return 'zip'
  if (ascii(bytes, 0, 3) === 'ID3') return 'audio' // mp3 with tag
  if (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0) return 'audio' // mp3/aac frame sync
  if (ascii(bytes, 0, 4) === 'OggS') return 'audio'
  if (ascii(bytes, 0, 4) === 'RIFF' && ascii(bytes, 8, 4) === 'WAVE') return 'audio'
  if (startsWith(bytes, [0x1a, 0x45, 0xdf, 0xa3])) return 'audio' // webm/matroska (recorded audio)
  if (ascii(bytes, 4, 4) === 'ftyp') return 'audio' // m4a/mp4 container
  return null
}

export interface ValidatedFile {
  file: File
  category: ChatFileCategory
}

export async function validateChatFile(file: File): Promise<ValidatedFile> {
  if (file.size === 0) throw new Error(`"${file.name}" is empty.`)
  if (file.size > CHAT_MAX_FILE_BYTES) throw new Error(`"${file.name}" is larger than the 50MB limit.`)
  const extension = ext(file.name)
  const byExtension = (Object.keys(EXTENSIONS) as ChatFileCategory[]).find((c) => EXTENSIONS[c].includes(extension))
  if (!byExtension) throw new Error(`".${extension || '?'}" files can't be sent here. Allowed: images, PDF, ZIP, audio.`)
  const head = new Uint8Array(await file.slice(0, 16).arrayBuffer())
  const byContent = sniff(head)
  if (byContent !== byExtension) throw new Error(`"${file.name}" doesn't look like a real ${byExtension} file, so it was blocked.`)
  const declared = file.type
  if (declared) {
    const family = declared.split('/')[0]
    const ok =
      (byExtension === 'image' && family === 'image') ||
      (byExtension === 'audio' && (family === 'audio' || declared === 'video/webm')) ||
      (byExtension === 'pdf' && declared === 'application/pdf') ||
      (byExtension === 'zip' && (declared.includes('zip') || declared === 'application/octet-stream'))
    if (!ok) throw new Error(`"${file.name}" has a mismatched type (${declared}), so it was blocked.`)
  }
  return { file, category: byExtension }
}
