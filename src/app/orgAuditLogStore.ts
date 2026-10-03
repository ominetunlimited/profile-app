import { useSyncExternalStore } from 'react'
import { supabase } from './supabaseClient'
import { joinRealtime } from './realtimeAuth'

/**
 * An organisation's audit trail, server-side (public.org_audit_log). Entries are appended by the database when the roster
 * changes or a verification decision is made, and by the app for other workspace actions; only the organisation's
 * administrators and compliance officers can read them.
 */
export interface OrgAuditEntry {
  id: string
  orgEmail: string
  actorEmail: string | null
  text: string
  at: string
}

interface Row {
  id: string
  org_email: string
  actor_email: string | null
  text: string
  at: string
}

let cache: Row[] = []
let version = 0
const listeners = new Set<() => void>()
const notify = () => {
  version++
  listeners.forEach((fn) => fn())
}

async function load() {
  const { data, error } = await supabase.from('org_audit_log').select('*').order('at', { ascending: false }).limit(500)
  if (!error) cache = (data as Row[]) ?? []
  notify()
}

if (typeof window !== 'undefined') {
  void load()
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') void load()
  })
  joinRealtime(() =>
    supabase
      .channel('org-audit')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'org_audit_log' }, () => void load())
      .subscribe(),
  )
}

export function useOrgAuditVersion(): number {
  return useSyncExternalStore(
    (fn) => {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    () => version,
    () => version,
  )
}

export function listAuditLogFor(orgEmail: string): OrgAuditEntry[] {
  const e = orgEmail.toLowerCase()
  return cache
    .filter((r) => r.org_email.toLowerCase() === e)
    .map((r) => ({ id: r.id, orgEmail: r.org_email, actorEmail: r.actor_email, text: r.text, at: r.at }))
    .sort((a, b) => b.at.localeCompare(a.at))
}

/** Appends an entry for an action the database doesn't already record itself. */
export async function logOrgAction(orgEmail: string, text: string): Promise<void> {
  const { error } = await supabase.rpc('org_log_action', { p_org: orgEmail, p_text: text })
  if (error) console.error('Audit log write failed:', error.message)
}
