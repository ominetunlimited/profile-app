/**
 * Learning progress, stored on the server (public.learning_enrollments, private to its owner) and read through a live
 * cache. Courses are not hosted on PROFILE yet, so this tracks what a person says they are learning; completing a topic
 * adds a self-reported entry to their CV (see LearningPage), and it never adds Trust Score points.
 */
import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

export type CourseStatus = 'in_progress' | 'completed'

export interface CourseEnrollment {
  topic: string
  status: CourseStatus
  startedAt: string
  completedAt: string | null
}

interface Row {
  owner_email: string
  topic: string
  status: CourseStatus
  started_at: string
  completed_at: string | null
}

const LEGACY_KEY = 'profile:demo-learning'

let cache: Row[] = []
let version = 0
const listeners = new Set<() => void>()
const notify = () => {
  version++
  listeners.forEach((fn) => fn())
}

async function load() {
  const { data, error } = await supabase.from('learning_enrollments').select('*')
  if (!error) {
    cache = (data as Row[]) ?? []
    await importLegacy()
  }
  notify()
}

/** One-time carry-over of progress recorded in this browser before it was stored on the server. */
async function importLegacy() {
  const { data } = await supabase.auth.getSession()
  const email = data.session?.user?.email?.toLowerCase()
  if (!email) return
  let legacy: Record<string, CourseEnrollment[]> = {}
  try {
    legacy = JSON.parse(localStorage.getItem(LEGACY_KEY) ?? '{}')
  } catch {
    return
  }
  const key = Object.keys(legacy).find((k) => k.toLowerCase() === email)
  if (!key) return
  const rows = legacy[key].filter((c) => !cache.some((r) => r.owner_email === email && r.topic === c.topic)).map((c) => ({ owner_email: email, topic: c.topic, status: c.status, started_at: c.startedAt, completed_at: c.completedAt }))
  if (rows.length > 0) {
    const { error } = await supabase.from('learning_enrollments').upsert(rows.map((r) => ({ ...r, status: 'in_progress', completed_at: null })), { onConflict: 'owner_email,topic', ignoreDuplicates: true })
    if (error) return
    for (const r of rows.filter((x) => x.status === 'completed')) await supabase.from('learning_enrollments').update({ status: 'completed', completed_at: r.completed_at }).eq('owner_email', email).eq('topic', r.topic)
    const { data: fresh } = await supabase.from('learning_enrollments').select('*')
    cache = (fresh as Row[]) ?? cache
  }
  delete legacy[key]
  try {
    localStorage.setItem(LEGACY_KEY, JSON.stringify(legacy))
  } catch {
    // best effort
  }
}

if (typeof window !== 'undefined') {
  void load()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load()
  })
  joinRealtime(() =>
    supabase
      .channel('learning-enrollments')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'learning_enrollments' }, () => void load())
      .subscribe(),
  )
}

export function useLearningVersion(): number {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => version,
    () => version,
  )
}

/** §50.9.7 PROFILE_ACADEMY_TOPICS, verbatim. */
export const ACADEMY_TOPICS = [
  'Building a professional profile',
  'Creating an effective portfolio',
  'CV and cover letter guidance',
  'Interview preparation',
  'Career planning',
  'Business profile optimisation',
  'Research presentation',
  'Trade and artisan branding',
  'Personal branding',
  'Networking best practices',
]

export function listEnrollments(ownerEmail: string): CourseEnrollment[] {
  const me = ownerEmail.toLowerCase()
  return cache
    .filter((r) => r.owner_email.toLowerCase() === me)
    .map((r) => ({ topic: r.topic, status: r.status, startedAt: r.started_at, completedAt: r.completed_at }))
}

export async function startCourse(ownerEmail: string, topic: string): Promise<void> {
  const me = ownerEmail.toLowerCase()
  if (cache.some((r) => r.owner_email.toLowerCase() === me && r.topic === topic)) return
  const row: Row = { owner_email: me, topic, status: 'in_progress', started_at: new Date().toISOString(), completed_at: null }
  cache = [...cache, row]
  notify()
  const { error } = await supabase.from('learning_enrollments').insert({ owner_email: me, topic })
  if (error) {
    cache = cache.filter((r) => r !== row)
    notify()
    throw new Error(error.message)
  }
}

export async function completeCourse(ownerEmail: string, topic: string): Promise<void> {
  const me = ownerEmail.toLowerCase()
  const completedAt = new Date().toISOString()
  const before = cache
  cache = cache.map((r) => (r.owner_email.toLowerCase() === me && r.topic === topic ? { ...r, status: 'completed' as const, completed_at: completedAt } : r))
  notify()
  const { error } = await supabase.from('learning_enrollments').update({ status: 'completed', completed_at: completedAt }).eq('owner_email', me).eq('topic', topic)
  if (error) {
    cache = before
    notify()
    throw new Error(error.message)
  }
}
