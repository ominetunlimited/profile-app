import { supabase } from './supabaseClient'

/**
 * Join a Realtime channel only AFTER the stored session's JWT is applied to
 * the realtime socket, and re-join on sign-in/sign-out.
 *
 * Why: `postgres_changes` is RLS-filtered using the token the channel was
 * joined with. Stores subscribe at import time — on a page reload that is
 * before the restored session reaches the socket, so the channel joined as
 * the anon role and silently delivered nothing (found in two-user chat
 * testing: live messages worked until either user reloaded).
 */
export function joinRealtime(build: () => ReturnType<typeof supabase.channel>): void {
  if (typeof window === 'undefined') return
  let channel: ReturnType<typeof supabase.channel> | null = null
  const connect = () => {
    if (channel) void supabase.removeChannel(channel)
    channel = build()
  }
  void supabase.auth.getSession().then(({ data }) => {
    if (data.session) supabase.realtime.setAuth(data.session.access_token)
    connect()
  })
  supabase.auth.onAuthStateChange((event, session) => {
    if (session) supabase.realtime.setAuth(session.access_token)
    if (event === 'SIGNED_IN' || event === 'SIGNED_OUT') connect()
  })
}
