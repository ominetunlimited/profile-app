/**
 * §8.5/§16.6 country adapter — illustrative 15-country list matching the
 * Handoff's own demonstrated set exactly (its footnote there says the same:
 * "the 15-country list here is illustrative; production covers every country").
 */
export interface CountryRecord {
  name: string
  code: string
  lang: string
  minAge: number
}

export const COUNTRIES: CountryRecord[] = [
  { name: 'Nigeria', code: '+234', lang: 'English', minAge: 16 },
  { name: 'United States', code: '+1', lang: 'English', minAge: 13 },
  { name: 'United Kingdom', code: '+44', lang: 'English', minAge: 13 },
  { name: 'Germany', code: '+49', lang: 'German', minAge: 16 },
  { name: 'France', code: '+33', lang: 'French', minAge: 15 },
  { name: 'India', code: '+91', lang: 'Hindi / English', minAge: 18 },
  { name: 'Brazil', code: '+55', lang: 'Portuguese', minAge: 13 },
  { name: 'Japan', code: '+81', lang: 'Japanese', minAge: 16 },
  { name: 'South Korea', code: '+82', lang: 'Korean', minAge: 14 },
  { name: 'South Africa', code: '+27', lang: 'English', minAge: 13 },
  { name: 'United Arab Emirates', code: '+971', lang: 'Arabic', minAge: 18 },
  { name: 'Kenya', code: '+254', lang: 'English / Swahili', minAge: 13 },
  { name: 'Ghana', code: '+233', lang: 'English', minAge: 13 },
  { name: 'Canada', code: '+1', lang: 'English / French', minAge: 13 },
  { name: 'Egypt', code: '+20', lang: 'Arabic', minAge: 16 },
]

export function ageFromDob(dobStr: string): number | null {
  if (!dobStr) return null
  const d = new Date(dobStr)
  if (isNaN(d.getTime())) return null
  const now = new Date()
  let age = now.getFullYear() - d.getFullYear()
  const notYetBirthday = now.getMonth() < d.getMonth() || (now.getMonth() === d.getMonth() && now.getDate() < d.getDate())
  if (notYetBirthday) age--
  return age
}

const FREE_EMAIL_DOMAINS = ['gmail.com', 'yahoo.com', 'hotmail.com', 'outlook.com', 'icloud.com', 'aol.com', 'protonmail.com']

/** §8.4.1 — organisation official email must not be on a free/personal domain. */
export function isOfficialDomainEmail(email: string): boolean {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return false
  const domain = email.trim().toLowerCase().split('@')[1]
  return !!domain && !FREE_EMAIL_DOMAINS.includes(domain)
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())
}
