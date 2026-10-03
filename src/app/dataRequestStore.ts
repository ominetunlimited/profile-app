import { supabase } from './supabaseClient'

export type DataRequestKind = 'correction' | 'withdraw_consent' | 'appeal' | 'delete'
export type DataRequestStatus = 'submitted' | 'in_review' | 'completed' | 'declined'

export interface DataRequest {
  id: string
  kind: DataRequestKind
  details: string | null
  status: DataRequestStatus
  createdAt: string
  resolvedAt: string | null
}

export const KIND_LABEL: Record<DataRequestKind, string> = {
  correction: 'Correction request',
  withdraw_consent: 'Consent withdrawal',
  appeal: 'Appeal',
  delete: 'Account deletion',
}

interface Row {
  id: string
  kind: DataRequestKind
  details: string | null
  status: DataRequestStatus
  created_at: string
  resolved_at: string | null
}

const toRequest = (r: Row): DataRequest => ({ id: r.id, kind: r.kind, details: r.details, status: r.status, createdAt: r.created_at, resolvedAt: r.resolved_at })

/** The signed-in account's own requests, newest first (RLS limits the rows to them). */
export async function listMyDataRequests(): Promise<DataRequest[]> {
  const { data, error } = await supabase.from('data_requests').select('*').order('created_at', { ascending: false })
  if (error) throw error
  return (data as Row[]).map(toRequest)
}

export async function submitDataRequest(email: string, kind: DataRequestKind, details?: string): Promise<DataRequest> {
  const { data, error } = await supabase.from('data_requests').insert({ user_email: email, kind, details: details?.trim() || null }).select().single()
  if (error) throw error
  return toRequest(data as Row)
}
