/**
 * §21.1 Profile Learn. Previously the whole screen was decorative — course
 * cards had no click handler, and "in-progress"/"completed" were
 * permanently, unconditionally empty regardless of what a user did, while
 * the page's own copy promised "Completed certificates auto-add to your CV
 * and contribute +8 to your Trust Score" — a promise nothing could ever
 * fulfil. This makes enrollment/completion real, and completion genuinely
 * adds a CertificationEntry to cvDetailsStore.ts (real auto-add-to-CV).
 * Trust Score's own +8 course_completed signal (§13.2) already requires a
 * real verification pipeline this build doesn't have — see trustScore.ts's
 * own honesty note — so completing a course here does not fabricate Trust
 * Score points it can't really award yet; the CV addition is real, the
 * Trust Score claim in the page copy is corrected to say so.
 */
export type CourseStatus = 'in_progress' | 'completed'

export interface CourseEnrollment {
  topic: string
  status: CourseStatus
  startedAt: string
  completedAt: string | null
}

const STORAGE_KEY = 'profile:demo-learning'

function readAll(): Record<string, CourseEnrollment[]> {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : {}
  } catch {
    return {}
  }
}

function writeAll(all: Record<string, CourseEnrollment[]>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(all))
  } catch {
    // best-effort demo scaffolding only
  }
}

export function listEnrollments(ownerEmail: string): CourseEnrollment[] {
  return readAll()[ownerEmail] ?? []
}

export function startCourse(ownerEmail: string, topic: string): void {
  const all = readAll()
  const mine = all[ownerEmail] ?? []
  if (mine.some((c) => c.topic === topic)) return
  all[ownerEmail] = [...mine, { topic, status: 'in_progress', startedAt: new Date().toISOString(), completedAt: null }]
  writeAll(all)
}

export function completeCourse(ownerEmail: string, topic: string): void {
  const all = readAll()
  const mine = all[ownerEmail] ?? []
  all[ownerEmail] = mine.map((c) => (c.topic === topic ? { ...c, status: 'completed' as const, completedAt: new Date().toISOString() } : c))
  writeAll(all)
}
