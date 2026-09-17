import Anthropic from '@anthropic-ai/sdk'

/**
 * Minimal local shape instead of depending on `@vercel/node` for types —
 * Vercel's Node runtime accepts a plain `(req, res) => void` handler at
 * deploy time regardless; this avoids a dev-only type-package dependency
 * for a handful of fields.
 */
interface ApiRequest {
  method?: string
  body?: unknown
}
interface ApiResponse {
  status(code: number): ApiResponse
  json(body: unknown): void
}

/**
 * V9 Unified Ecosystem Patch §11 — PROFILE Advisor, priority build. §48.0's
 * Hard Rules require it to "never fabricate, never bypass verification,
 * always be labeled as AI, and ground every answer in the user's real
 * data" — that can only be done honestly with a real model call, and a
 * real model call needs a secret API key held server-side. This build had
 * no backend at all before this file; it is one, a single Vercel
 * serverless function, deployed alongside the static SPA build.
 *
 * The client (AdvisorCreatorHub.tsx) sends the user's own real, already-
 * client-visible data as `context` — CV/Portfolio summary, Trust Score,
 * recorded skills/tools, recent activities — and this function folds that
 * into the system prompt so every answer is grounded in real records, per
 * the patch's own scope ("an agent with real access to the user's CV,
 * Portfolio, verified skills, tools... and Profile Health").
 *
 * Requires an `ANTHROPIC_API_KEY` environment variable on this Vercel
 * project — never sent to or readable by the client. Without it, this
 * honestly reports "not connected" rather than fabricating a reply.
 */

interface AdvisorContext {
  name: string
  headline: string
  country: string
  trustScoreTotal: number
  trustScoreTier: string
  skills: string[]
  tools: string[]
  cvExperienceCount: number
  portfolioItemCount: number
  recentActivities: { type: string; title: string }[]
}

const client = process.env.ANTHROPIC_API_KEY ? new Anthropic() : null

function buildSystemPrompt(context: AdvisorContext): string {
  return [
    'You are PROFILE Advisor, an AI assistant embedded in the PROFILE professional-identity platform.',
    'Hard rules, never break these:',
    '- Never fabricate, assume, or invent a credential, employer, verification status, or achievement that is not present in the data below.',
    '- Never describe anything as "verified" unless the data below says so — this build has no verification pipeline live yet, so Trust Score is honestly low for everyone.',
    '- Always be clear you are an AI assistant, not a human reviewer or a guarantee of any outcome.',
    "- If answering well requires information not in the data below, say so plainly and suggest what the user could record on PROFILE to make it answerable, rather than guessing.",
    '- Keep advice grounded in the data below; give general, clearly-labeled guidance for anything else (market conditions, specific employer practices) rather than presenting it as fact.',
    '- Keep answers concise and actionable — a few short paragraphs or a short list, not an essay.',
    '',
    "The user's real PROFILE data:",
    `Name: ${context.name || 'not set'}`,
    `Headline: ${context.headline || 'not set'}`,
    `Country: ${context.country || 'not set'}`,
    `Trust Score: ${context.trustScoreTotal}/1000 (${context.trustScoreTier})`,
    `Skills recorded: ${context.skills.length ? context.skills.join(', ') : 'none recorded yet'}`,
    `Tools recorded: ${context.tools.length ? context.tools.join(', ') : 'none recorded yet'}`,
    `CV experience entries: ${context.cvExperienceCount}`,
    `Portfolio items: ${context.portfolioItemCount}`,
    `Recent recorded activities: ${
      context.recentActivities.length ? context.recentActivities.map((a) => `${a.type} — ${a.title}`).join('; ') : 'none recorded yet'
    }`,
  ].join('\n')
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' })
    return
  }

  if (!client) {
    res.status(503).json({
      error: "PROFILE Advisor isn't connected to a live model on this deployment yet — ANTHROPIC_API_KEY is not configured.",
    })
    return
  }

  const body = req.body as { message?: unknown; context?: unknown } | undefined
  const message = typeof body?.message === 'string' ? body.message.trim() : ''
  if (!message) {
    res.status(400).json({ error: 'message is required' })
    return
  }
  if (message.length > 4000) {
    res.status(400).json({ error: 'Message is too long — please shorten it.' })
    return
  }

  const context = (body?.context ?? {}) as Partial<AdvisorContext>
  const safeContext: AdvisorContext = {
    name: typeof context.name === 'string' ? context.name : '',
    headline: typeof context.headline === 'string' ? context.headline : '',
    country: typeof context.country === 'string' ? context.country : '',
    trustScoreTotal: typeof context.trustScoreTotal === 'number' ? context.trustScoreTotal : 0,
    trustScoreTier: typeof context.trustScoreTier === 'string' ? context.trustScoreTier : 'Emerging',
    skills: Array.isArray(context.skills) ? context.skills.filter((s): s is string => typeof s === 'string').slice(0, 50) : [],
    tools: Array.isArray(context.tools) ? context.tools.filter((t): t is string => typeof t === 'string').slice(0, 50) : [],
    cvExperienceCount: typeof context.cvExperienceCount === 'number' ? context.cvExperienceCount : 0,
    portfolioItemCount: typeof context.portfolioItemCount === 'number' ? context.portfolioItemCount : 0,
    recentActivities: Array.isArray(context.recentActivities)
      ? context.recentActivities
          .filter((a): a is { type: string; title: string } => !!a && typeof a === 'object' && typeof (a as any).type === 'string' && typeof (a as any).title === 'string')
          .slice(0, 10)
      : [],
  }

  try {
    const response = await client.messages.create({
      model: 'claude-opus-5',
      max_tokens: 1500,
      system: buildSystemPrompt(safeContext),
      messages: [{ role: 'user', content: message }],
    })

    const textBlock = response.content.find((block): block is Anthropic.TextBlock => block.type === 'text')
    res.status(200).json({ reply: textBlock?.text ?? "I couldn't form a reply — please try again." })
  } catch (err) {
    console.error('advisor request failed', err)
    if (err instanceof Anthropic.AuthenticationError) {
      res.status(503).json({ error: "PROFILE Advisor's API key is invalid or missing on this deployment." })
      return
    }
    if (err instanceof Anthropic.RateLimitError) {
      res.status(429).json({ error: "PROFILE Advisor is getting a lot of requests right now — try again in a moment." })
      return
    }
    res.status(502).json({ error: 'PROFILE Advisor could not reach the model right now. Try again shortly.' })
  }
}
