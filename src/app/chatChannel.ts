/**
 * Typing indicator + presence for one open conversation, over a PRIVATE
 * Supabase Realtime channel (`conv:<conversation_id>`). Authorisation is
 * enforced in Postgres (policies on realtime.messages in migration 0007):
 * only members of the conversation can join or broadcast, so subscribing to
 * someone else's conversation id yields nothing. No database writes happen
 * for typing or presence — they're ephemeral broadcast/presence state.
 */
import { useEffect, useRef, useState, useCallback } from 'react'
import { supabase } from './supabaseClient'

const TYPING_EXPIRY_MS = 4000
const TYPING_EMIT_THROTTLE_MS = 2000

export function useConversationChannel(conversationId: string, selfEmail: string) {
  const [typing, setTyping] = useState<string[]>([])
  const [online, setOnline] = useState<string[]>([])
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null)
  const expiryTimers = useRef(new Map<string, ReturnType<typeof setTimeout>>())
  const lastEmit = useRef(0)
  const self = selfEmail.toLowerCase()

  useEffect(() => {
    const channel = supabase.channel(`conv:${conversationId}`, {
      config: { private: true, broadcast: { self: false }, presence: { key: self } },
    })
    channelRef.current = channel
    const timers = expiryTimers.current

    const clearTyping = (email: string) => {
      const t = timers.get(email)
      if (t) clearTimeout(t)
      timers.delete(email)
      setTyping((prev) => prev.filter((e) => e !== email))
    }

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const email = String(payload?.email ?? '').toLowerCase()
        if (!email || email === self) return
        if (!payload?.typing) {
          clearTyping(email)
          return
        }
        setTyping((prev) => (prev.includes(email) ? prev : [...prev, email]))
        const old = timers.get(email)
        if (old) clearTimeout(old)
        // Auto-expire so a lost "stopped typing" can never leave it stuck.
        timers.set(email, setTimeout(() => clearTyping(email), TYPING_EXPIRY_MS))
      })
      .on('presence', { event: 'sync' }, () => {
        setOnline(Object.keys(channel.presenceState()).filter((k) => k !== self))
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') await channel.track({ at: Date.now() })
      })

    return () => {
      timers.forEach((t) => clearTimeout(t))
      timers.clear()
      setTyping([])
      setOnline([])
      channelRef.current = null
      void supabase.removeChannel(channel)
    }
  }, [conversationId, self])

  const emitTyping = useCallback(
    (isTyping: boolean) => {
      const channel = channelRef.current
      if (!channel) return
      const now = Date.now()
      // Throttle "still typing" pings; always let an explicit stop through.
      if (isTyping && now - lastEmit.current < TYPING_EMIT_THROTTLE_MS) return
      lastEmit.current = isTyping ? now : 0
      void channel.send({ type: 'broadcast', event: 'typing', payload: { email: self, typing: isTyping } })
    },
    [self],
  )

  return { typing, online, emitTyping }
}
