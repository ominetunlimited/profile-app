import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import { supabase } from './supabaseClient'
import { fetchMyPlatformAdmin, type PlatformAdmin } from './platformAdminStore'

/**
 * The Admin Centre's own auth state — deliberately separate from
 * `AccountContext` (consumer accounts). Signing in here uses the same
 * shared Supabase client, so it replaces any consumer session active in
 * this browser tab (one real session at a time per tab, same as switching
 * between any two accounts) — that's expected, matching a wp-admin login
 * being a different identity than the public site's.
 */
interface AdminContextValue {
  admin: PlatformAdmin | null
  loading: boolean
  signIn: (email: string, password: string) => Promise<{ error: string | null }>
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AdminContext = createContext<AdminContextValue | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [admin, setAdmin] = useState<PlatformAdmin | null>(null)
  const [loading, setLoading] = useState(true)

  const refresh = useCallback(async () => {
    const found = await fetchMyPlatformAdmin()
    setAdmin(found)
  }, [])

  useEffect(() => {
    refresh().finally(() => setLoading(false))
    const { data: sub } = supabase.auth.onAuthStateChange(() => {
      refresh()
    })
    return () => sub.subscription.unsubscribe()
  }, [refresh])

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) return { error: error.message }
    const found = await fetchMyPlatformAdmin()
    if (!found) {
      await supabase.auth.signOut()
      return { error: 'This account is not a PROFILE admin.' }
    }
    setAdmin(found)
    return { error: null }
  }, [])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setAdmin(null)
  }, [])

  const value = useMemo<AdminContextValue>(() => ({ admin, loading, signIn, signOut, refresh }), [admin, loading, signIn, signOut, refresh])

  return <AdminContext.Provider value={value}>{children}</AdminContext.Provider>
}

export function useAdmin(): AdminContextValue {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error('useAdmin must be used within AdminProvider')
  return ctx
}
