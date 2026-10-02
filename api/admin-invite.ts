import { createClient } from '@supabase/supabase-js'
import crypto from 'node:crypto'

interface ApiRequest {
  method?: string
  body?: unknown
  headers: Record<string, string | string[] | undefined>
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
}

/**
 * Real Admin Centre — inviting a new platform admin needs to create a real
 * Supabase Auth user, which needs the service_role key. That key must never
 * reach the browser, so this one serverless function is the only place it's
 * used, exactly like `advisor.ts` is the only place `ANTHROPIC_API_KEY` is
 * used. Every caller is re-verified here as an active `super_administrator`
 * via their own Supabase session token — this endpoint is not protected by
 * obscurity, since its URL is visible in the client bundle.
 */
const PLATFORM_ROLES = ['super_administrator', 'admin', 'moderator', 'customer_support', 'compliance_officer', 'verification_officer']

// NOT process.env.SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY — this Vercel
// project has a native Supabase integration that auto-provisioned its own,
// separate, unused Supabase project under those exact names. Using them
// here validated every JWT against the wrong project's auth server and
// silently rejected every real admin session with "Invalid or expired
// session" (found via a temporary diagnostic endpoint, since
// `vercel env ls` can't read Sensitive values back to confirm this any
// other way). VITE_SUPABASE_URL is the real, already-public project URL;
// SUPABASE_ADMIN_SERVICE_ROLE_KEY is a dedicated var this file alone uses,
// set to that same real project's service_role key.
const url = process.env.VITE_SUPABASE_URL
const serviceRoleKey = process.env.SUPABASE_ADMIN_SERVICE_ROLE_KEY
const adminClient = url && serviceRoleKey ? createClient(url, serviceRoleKey) : null

function generateTemporaryPassword(): string {
  // Satisfies this app's own passwordMeetsPolicy (8+, upper, lower, digit,
  // symbol) — the invited admin is expected to change it on first sign-in.
  const random = crypto.randomBytes(9).toString('base64url')
  return `Prf-${random}!1`
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!adminClient) {
    res.status(503).json({ error: 'Admin invites are not configured on this deployment (missing SUPABASE_URL/SUPABASE_SERVICE_ROLE_KEY).' })
    return
  }

  const authHeader = req.headers.authorization
  const token = typeof authHeader === 'string' ? authHeader.replace(/^Bearer\s+/i, '') : ''
  if (!token) {
    res.status(401).json({ error: 'Missing session token' })
    return
  }

  const { data: callerUser, error: callerError } = await adminClient.auth.getUser(token)
  if (callerError || !callerUser.user) {
    res.status(401).json({ error: 'Invalid or expired session' })
    return
  }

  const { data: callerAdmin } = await adminClient.from('platform_admins').select('role, status').eq('id', callerUser.user.id).maybeSingle()
  if (!callerAdmin || callerAdmin.status !== 'active' || callerAdmin.role !== 'super_administrator') {
    res.status(403).json({ error: 'Only a super administrator can invite new admins' })
    return
  }

  const body = (req.body ?? {}) as { email?: unknown; role?: unknown; displayName?: unknown }
  const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : ''
  const role = typeof body.role === 'string' ? body.role : ''
  const displayName = typeof body.displayName === 'string' ? body.displayName.trim() : ''

  if (!email || !email.includes('@')) {
    res.status(400).json({ error: 'A valid email is required' })
    return
  }
  if (!PLATFORM_ROLES.includes(role)) {
    res.status(400).json({ error: 'Invalid role' })
    return
  }

  const temporaryPassword = generateTemporaryPassword()
  const { data: created, error: createError } = await adminClient.auth.admin.createUser({ email, password: temporaryPassword, email_confirm: true })
  if (createError || !created.user) {
    res.status(400).json({ error: createError?.message ?? 'Could not create the admin account — the email may already be in use.' })
    return
  }

  const { error: insertError } = await adminClient
    .from('platform_admins')
    .insert({ id: created.user.id, email, display_name: displayName || null, role, created_by: callerUser.user.email ?? 'unknown' })
  if (insertError) {
    // Roll back the auth user so a failed invite doesn't leave an orphaned
    // login with no platform_admins row (which would otherwise just look
    // like "not an admin" forever, silently).
    await adminClient.auth.admin.deleteUser(created.user.id)
    res.status(400).json({ error: insertError.message })
    return
  }

  res.status(200).json({ temporaryPassword })
}
