import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'

/** Support contact details, shown publicly (Help Centre) and edited in the Admin Centre. */
export interface PlatformSettings {
  support_email: string | null
  support_phone: string | null
  customer_care_number: string | null
  whatsapp_number: string | null
  support_hours: string | null
  support_address: string | null
  status_page_url: string | null
  app_url: string
}

export const CONTACT_FIELDS: { key: keyof Omit<PlatformSettings, 'app_url'>; label: string; placeholder: string; type: string }[] = [
  { key: 'support_email', label: 'Support email', placeholder: 'support@yourcompany.com', type: 'email' },
  { key: 'support_phone', label: 'Support phone', placeholder: '+234 …', type: 'tel' },
  { key: 'customer_care_number', label: 'Customer care number', placeholder: '+234 …', type: 'tel' },
  { key: 'whatsapp_number', label: 'WhatsApp number', placeholder: '+234 …', type: 'tel' },
  { key: 'support_hours', label: 'Support hours', placeholder: 'Mon–Fri, 9am–6pm WAT', type: 'text' },
  { key: 'support_address', label: 'Office address', placeholder: 'Street, city, country', type: 'text' },
  { key: 'status_page_url', label: 'Status page link', placeholder: 'https://status.yourcompany.com', type: 'url' },
]

export async function fetchPlatformSettings(): Promise<PlatformSettings | null> {
  const { data } = await supabase.from('platform_settings').select('*').eq('id', 1).maybeSingle()
  return (data as PlatformSettings | null) ?? null
}

export async function savePlatformSettings(patch: Partial<Omit<PlatformSettings, 'app_url'>> & { app_url?: string }): Promise<void> {
  const clean = Object.fromEntries(Object.entries(patch).map(([k, v]) => [k, typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v]))
  const { data, error } = await supabase.from('platform_settings').update(clean).eq('id', 1).select().maybeSingle()
  if (error) throw new Error(error.message)
  if (!data) throw new Error('You do not have permission to change these settings.')
}

/** The public contact details, or null while loading / when nothing has been set. */
export function usePlatformSettings(): PlatformSettings | null {
  const [s, setS] = useState<PlatformSettings | null>(null)
  useEffect(() => {
    let live = true
    void fetchPlatformSettings().then((v) => live && setS(v))
    return () => {
      live = false
    }
  }, [])
  return s
}

export interface NotificationSettings {
  telegram_enabled: boolean
  telegram_chat_id: string | null
  events: string[]
  token_set: boolean
}

export const ALERT_EVENTS: { key: string; label: string }[] = [
  { key: 'kyc', label: 'New identity check to review' },
  { key: 'verification_unrouted', label: 'Verification request needing staff' },
  { key: 'dispute', label: 'New dispute filed' },
  { key: 'data_request', label: 'New data request' },
  { key: 'org_claim', label: 'Organisation waiting for verification' },
  { key: 'feedback', label: 'New feedback submitted' },
]

export async function getNotificationSettings(): Promise<NotificationSettings> {
  const { data, error } = await supabase.rpc('admin_get_notification_settings')
  if (error) throw new Error(error.message)
  return data as NotificationSettings
}

export async function setTelegram(input: { token?: string; chatId: string; enabled: boolean; events: string[] }): Promise<void> {
  const { error } = await supabase.rpc('admin_set_telegram', { p_token: input.token ?? null, p_chat_id: input.chatId, p_enabled: input.enabled, p_events: input.events })
  if (error) throw new Error(error.message)
}

/** Sends a test message and reports what Telegram answered. */
export async function testTelegram(): Promise<{ ok: boolean; message: string }> {
  const { data: id, error } = await supabase.rpc('admin_test_telegram')
  if (error) throw new Error(error.message)
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    const { data } = await supabase.rpc('admin_telegram_result', { p_request: id })
    const r = data as { done: boolean; status?: number; error?: string; detail?: string } | null
    if (r?.done) {
      if (r.status === 200) return { ok: true, message: 'Delivered. Check your Telegram chat.' }
      if (r.error) return { ok: false, message: `Could not reach Telegram: ${r.error}` }
      let why = ''
      try {
        why = JSON.parse(r.detail ?? '{}').description ?? ''
      } catch {
        // not JSON
      }
      return { ok: false, message: `Telegram refused the message (${r.status})${why ? `: ${why}` : ''}. Check the bot token and chat id.` }
    }
  }
  return { ok: false, message: 'No answer from Telegram yet. Try again in a moment.' }
}

export interface EmailSettings {
  enabled: boolean
  from_address: string | null
  from_name: string
  reply_to: string | null
  key_set: boolean
}

export interface EmailLogEntry {
  to: string
  kind: string
  subject: string
  at: string
  status: number | null
}

export async function getEmailSettings(): Promise<EmailSettings> {
  const { data, error } = await supabase.rpc('admin_get_email_settings')
  if (error) throw new Error(error.message)
  return data as EmailSettings
}

export async function setEmail(input: { key?: string; fromAddress: string; fromName: string; replyTo: string; enabled: boolean }): Promise<void> {
  const { error } = await supabase.rpc('admin_set_email', { p_key: input.key ?? null, p_from_address: input.fromAddress, p_from_name: input.fromName, p_reply_to: input.replyTo, p_enabled: input.enabled })
  if (error) throw new Error(error.message)
}

export async function getEmailLog(): Promise<EmailLogEntry[]> {
  const { data, error } = await supabase.rpc('admin_email_log')
  if (error) throw new Error(error.message)
  return data as EmailLogEntry[]
}

/** Sends a test email and reports what the provider answered. */
export async function testEmail(to: string): Promise<{ ok: boolean; message: string }> {
  const { data: id, error } = await supabase.rpc('admin_test_email', { p_to: to })
  if (error) throw new Error(error.message)
  for (let i = 0; i < 8; i++) {
    await new Promise((r) => setTimeout(r, 1500))
    const { data } = await supabase.rpc('admin_email_result', { p_request: id })
    const r = data as { done: boolean; status?: number; error?: string; detail?: string } | null
    if (r?.done) {
      if (r.status && r.status >= 200 && r.status < 300) return { ok: true, message: `Accepted by the email provider. Check the inbox of ${to}.` }
      if (r.error) return { ok: false, message: `Could not reach the email provider: ${r.error}` }
      let why = ''
      try {
        why = JSON.parse(r.detail ?? '{}').message ?? ''
      } catch {
        // not JSON
      }
      return { ok: false, message: `The email provider refused it (${r.status})${why ? `: ${why}` : ''}. Check the API key and that the from-address belongs to a verified domain.` }
    }
  }
  return { ok: false, message: 'No answer from the email provider yet. Try again in a moment.' }
}

/** Whether invitations and other notices are currently emailed. */
export async function emailDeliveryOn(): Promise<boolean> {
  const { data } = await supabase.rpc('email_delivery_on')
  return data === true
}
