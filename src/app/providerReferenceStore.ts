import { supabase } from './supabaseClient'
import { createServerTable, persist } from './serverTable'
import { resolveTool } from './toolCatalogue'

/** Which recognised tools people used in their recorded work, stored on the server (public.provider_references) — an honest "used by" signal, never an endorsement. */
export interface ProviderReference {
  id: string
  toolId: string
  activityId: string
  userEmail: string
  createdAt: string
}

interface Row {
  id: string
  tool_id: string
  activity_id: string
  user_email: string
  created_at: string
}

const table = createServerTable<Row>('provider_references', { orderBy: 'created_at' })
export const useProviderReferencesVersion = table.useVersion

export function recordToolReferences(activityId: string, userEmail: string, rawTools: string[]): void {
  const additions: Row[] = []
  for (const raw of rawTools) {
    const tool = resolveTool(raw)
    if (!tool) continue
    if ([...table.rows(), ...additions].some((r) => r.tool_id === tool.id && r.activity_id === activityId && r.user_email.toLowerCase() === userEmail.toLowerCase())) continue
    additions.push({ id: crypto.randomUUID(), tool_id: tool.id, activity_id: activityId, user_email: userEmail.toLowerCase(), created_at: new Date().toISOString() })
  }
  if (additions.length === 0) return
  table.set([...table.rows(), ...additions])
  void persist(table, () => supabase.from('provider_references').insert(additions)).catch(() => undefined)
}

export function referenceCountForTool(toolId: string): number {
  return table.rows().filter((r) => r.tool_id === toolId).length
}

export function listReferencesForTool(toolId: string): ProviderReference[] {
  return table
    .rows()
    .filter((r) => r.tool_id === toolId)
    .map((r) => ({ id: r.id, toolId: r.tool_id, activityId: r.activity_id, userEmail: r.user_email, createdAt: r.created_at }))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
}
