/**
 * Skills and Tools Provider Ecosystem — previously every skill/tool a user
 * typed was pure free text with no concept of a canonical entity or a
 * recognised provider. This is a real, structured reference catalogue
 * (same pattern as countryData.ts's COUNTRIES / i18n.ts's LANGUAGES): a
 * fixed set of common tools this build recognises, each resolvable from
 * several real-world spellings a user might actually type, mapped to its
 * real provider.
 *
 * A tool/skill NOT in this catalogue is not an error — it just has no
 * resolvable provider yet, same as this build's country-adapter pattern
 * for verification (§16.6): modular, extendable, never silently guessed.
 * `verified` is honestly always false here — no Provider account exists
 * anywhere in this build to actually claim and verify an entity yet; this
 * catalogue only asserts "this is commonly known as X, made by Y," not an
 * institutional verification claim.
 */
export interface ProviderInfo {
  id: string
  name: string
  website?: string
}

export interface ToolInfo {
  id: string
  canonicalName: string
  category: string
  provider: ProviderInfo | null
  aliases: string[]
}

const PROVIDERS: Record<string, ProviderInfo> = {
  adobe: { id: 'adobe', name: 'Adobe', website: 'https://adobe.com' },
  microsoft: { id: 'microsoft', name: 'Microsoft', website: 'https://microsoft.com' },
  google: { id: 'google', name: 'Google', website: 'https://google.com' },
  figma: { id: 'figma', name: 'Figma', website: 'https://figma.com' },
  autodesk: { id: 'autodesk', name: 'Autodesk', website: 'https://autodesk.com' },
  salesforce: { id: 'salesforce', name: 'Salesforce', website: 'https://salesforce.com' },
  atlassian: { id: 'atlassian', name: 'Atlassian', website: 'https://atlassian.com' },
  meta: { id: 'meta', name: 'Meta', website: 'https://meta.com' },
  canva: { id: 'canva', name: 'Canva', website: 'https://canva.com' },
  github: { id: 'github', name: 'GitHub (Microsoft)', website: 'https://github.com' },
}

/** [canonical name, category, providerId | null, ...aliases (lowercased)] */
const CATALOGUE_SEED: [string, string, string | null, ...string[]][] = [
  ['Adobe Photoshop', 'Design software', 'adobe', 'photoshop', 'adobe ps', 'adobe photoshop cc', 'ps'],
  ['Adobe Illustrator', 'Design software', 'adobe', 'illustrator', 'adobe ai', 'ai'],
  ['Adobe Premiere Pro', 'Video editing software', 'adobe', 'premiere', 'premiere pro', 'adobe premiere'],
  ['Adobe After Effects', 'Motion graphics software', 'adobe', 'after effects', 'ae'],
  ['Adobe InDesign', 'Publishing software', 'adobe', 'indesign'],
  ['Microsoft Excel', 'Spreadsheet software', 'microsoft', 'excel', 'ms excel'],
  ['Microsoft Word', 'Word processor', 'microsoft', 'word', 'ms word'],
  ['Microsoft PowerPoint', 'Presentation software', 'microsoft', 'powerpoint', 'ms powerpoint', 'ppt'],
  ['Microsoft Teams', 'Collaboration software', 'microsoft', 'teams', 'ms teams'],
  ['Figma', 'Design software', 'figma', 'figma design'],
  ['AutoCAD', 'CAD software', 'autodesk', 'auto cad'],
  ['Salesforce', 'CRM platform', 'salesforce', 'sales force'],
  ['Slack', 'Team communication', null, 'slack'],
  ['Jira', 'Project management software', 'atlassian', 'jira software'],
  ['Trello', 'Project management software', 'atlassian', 'trello'],
  ['Confluence', 'Documentation software', 'atlassian', 'confluence'],
  ['Canva', 'Design software', 'canva', 'canva pro'],
  ['Google Analytics', 'Analytics platform', 'google', 'ga', 'google analytics 4', 'ga4'],
  ['Google Workspace', 'Productivity suite', 'google', 'g suite', 'gsuite', 'google docs', 'google sheets'],
  ['GitHub', 'Version control platform', 'github', 'git hub'],
  ['React', 'Frontend framework', null, 'react.js', 'reactjs'],
  ['TypeScript', 'Programming language', 'microsoft', 'ts'],
  ['Figma Prototyping', 'Design software', 'figma', 'figma prototype'],
  ['Meta Ads Manager', 'Advertising platform', 'meta', 'facebook ads', 'meta business suite'],
]

export const TOOL_CATALOGUE: ToolInfo[] = CATALOGUE_SEED.map(([canonicalName, category, providerId, ...aliases]) => ({
  id: canonicalName.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
  canonicalName,
  category,
  provider: providerId ? PROVIDERS[providerId] : null,
  aliases: [canonicalName.toLowerCase(), ...aliases],
}))

/**
 * Resolves a real user's free-text tool entry to a catalogue entity, if
 * one matches — the user's original wording is never overwritten in
 * storage (§1.1's "do not destroy the user's original wording"); this is
 * purely a display-time/notification-time lookup.
 */
export function resolveTool(rawText: string): ToolInfo | null {
  const normalized = rawText.trim().toLowerCase()
  if (!normalized) return null
  return TOOL_CATALOGUE.find((t) => t.aliases.includes(normalized)) ?? null
}

export function getProvider(providerId: string): ProviderInfo | undefined {
  return PROVIDERS[providerId]
}

export function listAllProviders(): ProviderInfo[] {
  return Object.values(PROVIDERS)
}

export function listToolsForProvider(providerId: string): ToolInfo[] {
  return TOOL_CATALOGUE.filter((t) => t.provider?.id === providerId)
}
