import type { CvData } from './careerData'

export const COVER_LETTER_TONES = ['Direct', 'Formal', 'Warm'] as const
export type CoverLetterTone = (typeof COVER_LETTER_TONES)[number]

const OPENERS: Record<CoverLetterTone, string> = {
  Direct: "I'm writing to apply for",
  Formal: 'I would like to be considered for',
  Warm: "I'm reaching out about",
}

/**
 * §47.4 PROFILE Cover Letter's real generation logic, extracted so §6.3's
 * "use the existing cover-letter design, don't replace it" requirement is
 * literally true: CoverLetterPage.tsx and the Apply With PROFILE flow both
 * call this one function, rather than the apply flow reimplementing its
 * own draft logic.
 */
export function buildCoverLetterDraft(cv: CvData, targetRole: string, targetOrg: string, tone: CoverLetterTone): string {
  const opener = OPENERS[tone]
  const roleLine = targetRole ? `the ${targetRole}${targetOrg ? ` role at ${targetOrg}` : ' role'}` : 'this opportunity'
  const evidenceLine = cv.hasContent
    ? `Over my recorded activity, I've worked as ${cv.experience.map((e) => `${e.title} at ${e.org}`).join('; ')}. Every claim here is a record on my PROFILE — not something I'm asking you to take on trust.`
    : "I haven't recorded any activity on PROFILE yet, so this draft can't cite verified evidence — record your first activity from Home, then regenerate."
  return `${opener} ${roleLine}.\n\n${evidenceLine}\n\nI'd welcome the chance to talk through how this applies here.\n\n${cv.name}`
}
