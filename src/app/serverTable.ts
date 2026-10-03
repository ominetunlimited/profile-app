import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

/**
 * A small live cache over one Postgres table (row-level security decides which rows this account can see). Reads are
 * synchronous; writes update the cache straight away (`set`) and the caller persists them, calling `reload` on failure
 * so the screen never shows something the server refused. Any change made by anyone triggers a reload.
 */
export interface ServerTable<R> {
  rows(): R[]
  ready(): boolean
  reload(): Promise<void>
  set(next: R[]): void
  useVersion(): number
}

export function createServerTable<R>(table: string, opts: { orderBy?: string; ascending?: boolean; limit?: number } = {}): ServerTable<R> {
  let rows: R[] = []
  let loaded = false
  let version = 0
  const listeners = new Set<() => void>()
  const notify = () => {
    version++
    listeners.forEach((fn) => fn())
  }

  async function reload() {
    let q = supabase.from(table).select('*')
    if (opts.orderBy) q = q.order(opts.orderBy, { ascending: opts.ascending ?? false })
    if (opts.limit) q = q.limit(opts.limit)
    const { data, error } = await q
    if (!error) {
      rows = (data as R[]) ?? []
      loaded = true
    }
    notify()
  }

  if (typeof window !== 'undefined') {
    void reload()
    supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void reload()
    })
    joinRealtime(() =>
      supabase
        .channel(`${table}-cache`)
        .on('postgres_changes', { event: '*', schema: 'public', table }, () => void reload())
        .subscribe(),
    )
  }

  return {
    rows: () => rows,
    ready: () => loaded,
    reload,
    set(next) {
      rows = next
      notify()
    },
    useVersion: () =>
      useSyncExternalStore(
        (fn) => {
          listeners.add(fn)
          return () => listeners.delete(fn)
        },
        () => version,
        () => version,
      ),
  }
}

/** Persists a write; if the server refuses it, reloads the true state and reports the problem. */
export async function persist(table: { reload(): Promise<void> }, run: () => PromiseLike<{ error: { message: string } | null }>): Promise<void> {
  const { error } = await run()
  if (error) {
    await table.reload()
    console.error('Save failed:', error.message)
    throw new Error(error.message)
  }
}
