/**
 * Real activity media-upload pipeline — Supabase Storage (private bucket
 * `activity-media`) + `public.media_assets` (RLS mirrors the parent
 * entity's own visibility — see supabase/migrations/0006_media_assets.sql).
 * Same cache + Realtime pattern as every other store this session:
 * `uploadMediaAsset`/`deleteMediaAsset` are real async writes;
 * `listMediaFor` stays synchronous, backed by a live cache, since
 * ActivityCard renders attachments inline for every activity in the feed.
 *
 * Honest scope note (carried from the migration): §37.21/§50.10.5 specify
 * resumable uploads up to 20GB, server-side virus scanning, and automatic
 * thumbnail/preview generation. This does a direct (non-resumable) upload
 * with a 50MB practical cap, no virus scanning, no server-side
 * thumbnailing — a real, flagged gap against the spec, not a silent one.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'
import { makeImageVariants } from './imageProcessing'

export type MediaTargetType = 'activity' | 'credential'
export type FileCategory = 'image' | 'video' | 'audio' | 'pdf' | 'docx' | 'pptx' | 'xlsx' | 'epub' | 'other'

export interface MediaAsset {
  id: string
  ownerEmail: string
  targetType: MediaTargetType
  targetId: string
  storagePath: string
  previewPath: string | null
  thumbPath: string | null
  width: number | null
  height: number | null
  fileName: string
  mimeType: string
  fileCategory: FileCategory
  sizeBytes: number
  copyrightId: string
  contentHash: string
  createdAt: string
}

interface MediaAssetRow {
  id: string
  owner_email: string
  target_type: MediaTargetType
  target_id: string
  storage_path: string
  preview_path: string | null
  thumb_path: string | null
  width: number | null
  height: number | null
  file_name: string
  mime_type: string
  file_category: FileCategory
  size_bytes: number
  copyright_id: string
  content_hash: string
  created_at: string
}

function rowToAsset(r: MediaAssetRow): MediaAsset {
  return {
    id: r.id,
    ownerEmail: r.owner_email,
    targetType: r.target_type,
    targetId: r.target_id,
    storagePath: r.storage_path,
    previewPath: r.preview_path ?? null,
    thumbPath: r.thumb_path ?? null,
    width: r.width ?? null,
    height: r.height ?? null,
    fileName: r.file_name,
    mimeType: r.mime_type,
    fileCategory: r.file_category,
    sizeBytes: r.size_bytes,
    copyrightId: r.copyright_id,
    contentHash: r.content_hash,
    createdAt: r.created_at,
  }
}

/** §11.4 COMPOSER_UPLOAD_SPEC's accepted type list — video/audio/pdf/docx/
 * pptx/xlsx/epub explicitly named; mobi/zip/research_paper omitted from this
 * v1 (research_paper is a usage label on a pdf, not a distinct format; mobi
 * has no reliable browser-side MIME detection; zip is deferred). */
const CATEGORY_BY_MIME: { test: (mime: string, name: string) => boolean; category: FileCategory }[] = [
  { test: (m) => m.startsWith('image/'), category: 'image' },
  { test: (m) => m.startsWith('video/'), category: 'video' },
  { test: (m) => m.startsWith('audio/'), category: 'audio' },
  { test: (m) => m === 'application/pdf', category: 'pdf' },
  { test: (m) => m === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || m === 'application/msword', category: 'docx' },
  { test: (m) => m === 'application/vnd.openxmlformats-officedocument.presentationml.presentation' || m === 'application/vnd.ms-powerpoint', category: 'pptx' },
  { test: (m) => m === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' || m === 'application/vnd.ms-excel', category: 'xlsx' },
  { test: (_m, n) => n.toLowerCase().endsWith('.epub'), category: 'epub' },
]

export function categorizeFile(file: File): FileCategory {
  const match = CATEGORY_BY_MIME.find((c) => c.test(file.type, file.name))
  return match?.category ?? 'other'
}

export const ACCEPTED_FILE_TYPES =
  'image/*,video/*,audio/*,application/pdf,.docx,.doc,.pptx,.ppt,.xlsx,.xls,.epub'
export const MAX_FILE_SIZE_BYTES = 50 * 1024 * 1024 // 50MB practical cap — see module header

export async function sha256Hex(file: Blob): Promise<string> {
  const buffer = await file.arrayBuffer()
  const digest = await crypto.subtle.digest('SHA-256', buffer)
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

/** §11.4/§50.10.8 — "#PRF-YYYY-XXXXXX": the Master Prompt itself gives
 * inconsistent digit counts across sections; 6 alphanumeric characters
 * picked here and documented rather than silently choosing one. */
function generateCopyrightId(): string {
  const year = new Date().getFullYear()
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 6).toUpperCase()
  return `#PRF-${year}-${random}`
}

// --- Live cache ---------------------------------------------------------
let cache: MediaAssetRow[] = []
let cacheVersion = 0
const listeners = new Set<() => void>()
const signedUrlCache = new Map<string, { url: string; expiresAt: number }>()

function notifyListeners() {
  cacheVersion++
  listeners.forEach((fn) => fn())
}

async function loadCache() {
  const { data } = await supabase.from('media_assets').select('*')
  cache = data ?? []
  notifyListeners()
}

function upsertCacheRow(row: MediaAssetRow) {
  const idx = cache.findIndex((r) => r.id === row.id)
  if (idx === -1) cache = [...cache, row]
  else cache = [...cache.slice(0, idx), row, ...cache.slice(idx + 1)]
  notifyListeners()
}

function removeCacheRow(id: string) {
  cache = cache.filter((r) => r.id !== id)
  notifyListeners()
}

if (typeof window !== 'undefined') {
  loadCache()
  // A session that signs in after page load (e.g. platform staff) must see the rows RLS now allows.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void loadCache()
  })
  joinRealtime(() =>
    supabase
    .channel('media-assets-cache')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'media_assets' }, (payload) => {
      if (payload.eventType === 'DELETE') removeCacheRow((payload.old as MediaAssetRow).id)
      else upsertCacheRow(payload.new as MediaAssetRow)
    })
    .subscribe(),
  )
}

export function onMediaAssetsChange(fn: () => void): () => void {
  listeners.add(fn)
  return () => listeners.delete(fn)
}

export function useMediaAssetsCacheVersion(): number {
  return useSyncExternalStore(onMediaAssetsChange, () => cacheVersion, () => cacheVersion)
}

/** Fetch one asset row on demand (RLS decides) and cache it — used where a viewer may not have it loaded yet. */
export async function ensureMediaAsset(id: string): Promise<MediaAsset | undefined> {
  const have = cache.find((r) => r.id === id)
  if (have) return rowToAsset(have)
  const { data } = await supabase.from('media_assets').select('*').eq('id', id).maybeSingle()
  if (!data) return undefined
  upsertCacheRow(data as MediaAssetRow)
  return rowToAsset(data as MediaAssetRow)
}

export function getMediaAssetById(id: string): MediaAsset | undefined {
  const row = cache.find((r) => r.id === id)
  return row ? rowToAsset(row) : undefined
}

export function listMediaFor(targetType: MediaTargetType, targetId: string): MediaAsset[] {
  return cache
    .filter((r) => r.target_type === targetType && r.target_id === targetId)
    .map(rowToAsset)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

export interface UploadMediaInput {
  file: File
  ownerEmail: string
  targetType: MediaTargetType
  targetId: string
}

export async function uploadMediaAsset({ file, ownerEmail, targetType, targetId }: UploadMediaInput): Promise<MediaAsset> {
  if (file.size > MAX_FILE_SIZE_BYTES) {
    throw new Error(`"${file.name}" is larger than the 50MB limit for this build.`)
  }
  const fileCategory = categorizeFile(file)
  const contentHash = await sha256Hex(file)
  const assetId = crypto.randomUUID()
  // §37.21 — randomised object names, never the user-supplied filename, so a
  // guessed/enumerated URL can't be used to probe for other people's files.
  const storagePath = `${ownerEmail.toLowerCase()}/${assetId}/${crypto.randomUUID()}`

  const { error: uploadError } = await supabase.storage.from('activity-media').upload(storagePath, file, { contentType: file.type || 'application/octet-stream' })
  if (uploadError) throw uploadError

  // Optimised viewing variants (feed must never load full-resolution originals).
  let previewPath: string | null = null
  let thumbPath: string | null = null
  let width: number | null = null
  let height: number | null = null
  if (fileCategory === 'image') {
    const variants = await makeImageVariants(file).catch(() => null)
    if (variants) {
      const p = `${storagePath}-preview`
      const t = `${storagePath}-thumb`
      const [up, ut] = await Promise.all([
        supabase.storage.from('activity-media').upload(p, variants.preview, { contentType: variants.preview.type }),
        supabase.storage.from('activity-media').upload(t, variants.thumb, { contentType: variants.thumb.type }),
      ])
      if (!up.error && !ut.error) {
        previewPath = p
        thumbPath = t
      }
      width = variants.width
      height = variants.height
    }
  }

  const { data, error } = await supabase
    .from('media_assets')
    .insert({
      id: assetId,
      owner_email: ownerEmail,
      target_type: targetType,
      target_id: targetId,
      storage_path: storagePath,
      preview_path: previewPath,
      thumb_path: thumbPath,
      width,
      height,
      file_name: file.name,
      mime_type: file.type || 'application/octet-stream',
      file_category: fileCategory,
      size_bytes: file.size,
      copyright_id: generateCopyrightId(),
      content_hash: contentHash,
    })
    .select()
    .single()
  if (error) {
    // Don't leave an orphaned file in Storage with no database row pointing
    // at it if the insert failed (e.g. a real duplicate copyright_id clash).
    await supabase.storage.from('activity-media').remove([storagePath, ...(previewPath ? [previewPath] : []), ...(thumbPath ? [thumbPath] : [])])
    throw error
  }
  const row = data as MediaAssetRow
  upsertCacheRow(row)
  return rowToAsset(row)
}

export async function deleteMediaAsset(asset: MediaAsset): Promise<void> {
  await supabase.storage.from('activity-media').remove([asset.storagePath, ...(asset.previewPath ? [asset.previewPath] : []), ...(asset.thumbPath ? [asset.thumbPath] : [])])
  await supabase.from('media_assets').delete().eq('id', asset.id)
  removeCacheRow(asset.id)
}

/**
 * §37.21 — private files served through signed, time-limited URLs, never a
 * permanent public link. Cached in memory for the URL's lifetime so
 * re-rendering the same card doesn't re-sign on every paint.
 */
export async function getSignedMediaUrl(asset: MediaAsset, expiresInSeconds = 3600, variant: 'original' | 'preview' | 'thumb' = 'original'): Promise<string | null> {
  const path = variant === 'thumb' ? asset.thumbPath ?? asset.previewPath ?? asset.storagePath : variant === 'preview' ? asset.previewPath ?? asset.storagePath : asset.storagePath
  const cacheKey = `${asset.id}:${path}`
  const cached = signedUrlCache.get(cacheKey)
  if (cached && cached.expiresAt > Date.now() + 30_000) return cached.url
  const { data, error } = await supabase.storage.from('activity-media').createSignedUrl(path, expiresInSeconds)
  if (error || !data) return null
  signedUrlCache.set(cacheKey, { url: data.signedUrl, expiresAt: Date.now() + expiresInSeconds * 1000 })
  return data.signedUrl
}
