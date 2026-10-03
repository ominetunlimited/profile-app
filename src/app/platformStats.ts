import { supabase } from './supabaseClient'

/** Platform-wide counts for Mission Control — produced by a staff-only database function; counts only, never anything about an individual. */
export interface PlatformStats {
  generated_at: string
  accounts: { total: number; individuals: number; organisations: number; organisations_verified: number; organisation_claims_pending: number; private: number; discoverable: number; public: number }
  activity: { records_total: number; records_7d: number; jobs_open: number; communities: number }
  identity: { kyc_waiting: number; kyc_approved: number; kyc_rejected: number }
  verification: { requests_open: number; requests_unrouted_open: number; requests_verified: number; requests_rejected: number }
  cases: { disputes_open: number; disputes_total: number; data_requests_open: number; data_requests_total: number }
  ai: { outputs_7d: number; flagged: number; reviewed: number; unreviewed: number }
  security: { tables_total: number; tables_without_rls: number }
}

export async function fetchPlatformStats(): Promise<PlatformStats> {
  const { data, error } = await supabase.rpc('platform_stats')
  if (error) throw new Error(error.message)
  return data as PlatformStats
}
