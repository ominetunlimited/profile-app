import { createClient } from '@supabase/supabase-js'

/**
 * Pipeline repair Phase A — the one real Supabase client every store module
 * uses, replacing the `localStorage` `readAll()`/`writeAll()` pattern that
 * made every account/activity/message/etc. visible only in the browser that
 * created it (see PIPELINE_FORENSICS_REPORT.md). Uses the publishable key —
 * safe to ship to the browser, since every table it can reach is governed
 * by the RLS policies in supabase/migrations/0001_init.sql, not by keeping
 * this key secret.
 */
const url = import.meta.env.VITE_SUPABASE_URL
const publishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY

if (!url || !publishableKey) {
  // eslint-disable-next-line no-console
  console.error('Supabase env vars missing — VITE_SUPABASE_URL / VITE_SUPABASE_PUBLISHABLE_KEY. See .env.local.example.')
}

export const supabase = createClient(url ?? '', publishableKey ?? '')
