/**
 * On-device document OCR. The photo is preprocessed in a canvas (orientation,
 * size, grayscale + contrast) and read by Tesseract.js running in the user's
 * browser — the image is never sent to a third-party OCR service. The first
 * run downloads the engine and English model (cached afterwards).
 *
 * OCR is a convenience that PRE-FILLS a form; nothing it reads is trusted.
 * The user must confirm or correct every field, and a human reviewer still
 * decides on any identity/credential verification.
 */
export type DocumentKind = 'national_id' | 'passport' | 'drivers_licence' | 'residence_permit' | 'certificate' | 'licence' | 'other'

export interface ExtractedFields {
  documentKind: DocumentKind
  fullName?: string
  idNumber?: string
  dateOfBirth?: string
  issueDate?: string
  expiryDate?: string
  issuer?: string
  /** How many of the key fields were found — a hint, not a guarantee of accuracy. */
  confidence: 'low' | 'medium' | 'high'
}

export interface OcrProgress {
  status: string
  progress: number
}

/** Orientation-correct, size-capped, grayscale + contrast-stretched copy. */
export async function preprocessForOcr(source: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(source, { imageOrientation: 'from-image' })
  try {
    const longest = Math.max(bitmap.width, bitmap.height)
    const scale = longest > 2000 ? 2000 / longest : longest < 900 ? 900 / longest : 1
    const w = Math.round(bitmap.width * scale)
    const h = Math.round(bitmap.height * scale)
    const canvas = document.createElement('canvas')
    canvas.width = w
    canvas.height = h
    const ctx = canvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) return source
    ctx.drawImage(bitmap, 0, 0, w, h)
    const img = ctx.getImageData(0, 0, w, h)
    const d = img.data
    let lo = 255
    let hi = 0
    for (let i = 0; i < d.length; i += 4) {
      const g = Math.round(0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2])
      d[i] = d[i + 1] = d[i + 2] = g
      if (g < lo) lo = g
      if (g > hi) hi = g
    }
    const range = Math.max(1, hi - lo)
    for (let i = 0; i < d.length; i += 4) {
      const v = Math.min(255, Math.max(0, Math.round(((d[i] - lo) / range) * 255)))
      d[i] = d[i + 1] = d[i + 2] = v
    }
    ctx.putImageData(img, 0, 0)
    return await new Promise<Blob>((resolve) => canvas.toBlob((b) => resolve(b ?? source), 'image/png'))
  } finally {
    bitmap.close()
  }
}

/** Reads a photographed document. Tesseract is loaded lazily (its own chunk). */
export async function recognizeDocument(file: Blob, onProgress?: (p: OcrProgress) => void): Promise<{ text: string; engineConfidence: number }> {
  const { createWorker } = await import('tesseract.js')
  const worker = await createWorker('eng', 1, {
    logger: (m: { status: string; progress: number }) => onProgress?.({ status: m.status, progress: m.progress }),
  })
  try {
    const prepared = await preprocessForOcr(file)
    const { data } = await worker.recognize(prepared)
    return { text: data.text, engineConfidence: data.confidence }
  } finally {
    await worker.terminate()
  }
}

// --- Field extraction (pure, unit-testable) ------------------------------
const MONTHS: Record<string, number> = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 }
const pad = (n: number) => String(n).padStart(2, '0')

function toIso(d: number, m: number, y: number): string | null {
  if (y < 100) y += y > 40 ? 1900 : 2000
  if (m < 1 || m > 12 || d < 1 || d > 31 || y < 1900 || y > 2100) return null
  return `${y}-${pad(m)}-${pad(d)}`
}

/** All dates on a line, normalised to ISO (day-first, as is standard for ID documents). */
function datesIn(line: string): string[] {
  const out: string[] = []
  for (const m of line.matchAll(/\b(\d{1,2})[\/\-. ](\d{1,2})[\/\-. ](\d{2,4})\b/g)) {
    const iso = toIso(Number(m[1]), Number(m[2]), Number(m[3]))
    if (iso) out.push(iso)
  }
  for (const m of line.matchAll(/\b(\d{1,2})\s*([A-Za-z]{3})[A-Za-z]*\.?\s*,?\s*(\d{2,4})\b/g)) {
    const mon = MONTHS[m[2].toUpperCase()]
    const iso = mon ? toIso(Number(m[1]), mon, Number(m[3])) : null
    if (iso) out.push(iso)
  }
  for (const m of line.matchAll(/\b(\d{4})-(\d{2})-(\d{2})\b/g)) {
    const iso = toIso(Number(m[3]), Number(m[2]), Number(m[1]))
    if (iso) out.push(iso)
  }
  return out
}

const titleCase = (s: string) => s.toLowerCase().replace(/\b[a-z]/g, (c) => c.toUpperCase())

export function extractDocumentFields(rawText: string): ExtractedFields {
  const lines = rawText
    .split(/\r?\n/)
    .map((l) => l.replace(/\s+/g, ' ').trim())
    .filter(Boolean)
  const upper = lines.map((l) => l.toUpperCase())
  const blob = upper.join(' \n ')

  let documentKind: DocumentKind = 'other'
  if (/PASSPORT/.test(blob)) documentKind = 'passport'
  else if (/DRIVER|DRIVING/.test(blob) && /LICEN[CS]E/.test(blob)) documentKind = 'drivers_licence'
  else if (/RESIDENCE PERMIT|RESIDENT PERMIT/.test(blob)) documentKind = 'residence_permit'
  else if (/NATIONAL (IDENTITY|ID)|IDENTITY CARD|ID CARD/.test(blob)) documentKind = 'national_id'
  else if (/CERTIFICATE|DIPLOMA|DEGREE/.test(blob)) documentKind = 'certificate'
  else if (/LICEN[CS]E|LICEN[CS]ED|PRACTI[CS]ING/.test(blob)) documentKind = 'licence'

  let dateOfBirth: string | undefined
  let issueDate: string | undefined
  let expiryDate: string | undefined
  const unlabeled: string[] = []
  upper.forEach((line, i) => {
    // A label may sit on the previous line with the value on this one.
    const context = `${upper[i - 1] ?? ''} ${line}`
    for (const iso of datesIn(lines[i])) {
      if (/BIRTH|\bDOB\b|\bD\.O\.B/.test(line) || (/BIRTH|\bDOB\b/.test(context) && !/ISSU|EXPIR|VALID/.test(line))) dateOfBirth ??= iso
      else if (/EXPIR|\bEXP\b|VALID (UNTIL|TILL|THRU)|DATE OF EXPIRY/.test(line)) expiryDate ??= iso
      else if (/ISSU|DATE OF ISSUE/.test(line)) issueDate ??= iso
      else unlabeled.push(iso)
    }
  })

  // Identifier: prefer a labelled value, else the strongest digit-bearing token.
  let idNumber: string | undefined
  const labelled = /(?:\bNO\b\.?|NUMBER|\bNIN\b|\bID\b|LICEN[CS]E NO|PASSPORT NO|DOCUMENT NO|REG(?:ISTRATION)? NO)\s*[:\-#]?\s*([A-Z0-9][A-Z0-9\- ]{4,18}[A-Z0-9])/
  for (const line of upper) {
    const m = line.match(labelled)
    if (m && (m[1].match(/\d/g) ?? []).length >= 4) {
      idNumber = m[1].replace(/\s+/g, '')
      break
    }
  }
  if (!idNumber) {
    const tokens = upper.join(' ').match(/\b[A-Z0-9]{6,16}\b/g) ?? []
    idNumber = tokens
      .filter((t) => (t.match(/\d/g) ?? []).length >= 5)
      .sort((a, b) => b.length - a.length)[0]
  }

  // Name: SURNAME + GIVEN NAMES, or a FULL NAME / NAME line.
  let fullName: string | undefined
  const valueAfter = (labelRe: RegExp): string | undefined => {
    for (let i = 0; i < lines.length; i++) {
      if (labelRe.test(upper[i])) {
        const inline = lines[i].replace(labelRe, '').replace(/^[:\-\s]+/, '').trim()
        const candidate = inline.length >= 2 ? inline : lines[i + 1]
        if (candidate && /[A-Za-z]{2,}/.test(candidate) && !/\d{3,}/.test(candidate)) return candidate.replace(/[^A-Za-z' \-]/g, '').trim()
      }
    }
    return undefined
  }
  const surname = valueAfter(/^(?:SURNAME|LAST NAME|FAMILY NAME)\b/)
  const given = valueAfter(/^(?:GIVEN NAMES?|FIRST NAMES?|OTHER NAMES?)\b/)
  if (surname || given) fullName = titleCase([given, surname].filter(Boolean).join(' '))
  else {
    const n = valueAfter(/^(?:FULL NAME|NAME)\b/)
    if (n) fullName = titleCase(n)
  }

  const issuerLine = lines.find((_, i) => /REPUBLIC OF|MINISTRY|UNIVERSITY|COUNCIL|BOARD|AUTHORITY|COMMISSION|INSTITUTE|COLLEGE|POLYTECHNIC/.test(upper[i]))
  const issuer = issuerLine ? titleCase(issuerLine.replace(/[^A-Za-z&' \-]/g, '').trim()) : undefined

  // A lone unlabelled date on a licence/certificate is most likely the issue date.
  if (!issueDate && unlabeled.length === 1 && (documentKind === 'certificate' || documentKind === 'licence')) issueDate = unlabeled[0]

  const found = [fullName, idNumber, dateOfBirth, expiryDate ?? issueDate, issuer].filter(Boolean).length
  return {
    documentKind,
    ...(fullName ? { fullName } : {}),
    ...(idNumber ? { idNumber } : {}),
    ...(dateOfBirth ? { dateOfBirth } : {}),
    ...(issueDate ? { issueDate } : {}),
    ...(expiryDate ? { expiryDate } : {}),
    ...(issuer ? { issuer } : {}),
    confidence: found >= 4 ? 'high' : found >= 2 ? 'medium' : 'low',
  }
}
