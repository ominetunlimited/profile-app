import type { CareerStage, OrganisationType, Pathway } from '@/app/accountTypes'

export type Step =
  | 'account-type'
  | 'individual-info'
  | 'email-verify'
  | 'consent'
  | 'goals'
  | 'profile-setup'
  | 'journey-setup'
  | 'done'
  | 'org-gate'
  | 'org-info'
  | 'org-consent'
  | 'org-done'

export interface WizardState {
  step: Step
  accountKind: 'individual' | 'organisation' | null
  pathway: Pathway | null
  careerStage: CareerStage | null
  orgType: OrganisationType | null

  legalName: string
  preferredDisplayName: string
  country: string
  dob: string
  email: string
  password: string
  confirmPassword: string

  orgLegalName: string
  tradingName: string
  officialEmail: string
  orgPassword: string
  orgConfirmPassword: string
  registrationNumber: string

  otp: string

  consentIdentity: boolean
  consentPrivacy: boolean

  goals: string[]

  profilePhoto: string | null
  coverPhoto: string | null
  username: string
  headline: string
  generationMode: 'ai_auto' | 'manual' | 'hybrid'

  journeyStage: string
  fieldOfStudy: string
  craftArea: string
}

export const initialWizardState: WizardState = {
  step: 'account-type',
  accountKind: null,
  pathway: null,
  careerStage: null,
  orgType: null,

  legalName: '',
  preferredDisplayName: '',
  country: '',
  dob: '',
  email: '',
  password: '',
  confirmPassword: '',

  orgLegalName: '',
  tradingName: '',
  officialEmail: '',
  orgPassword: '',
  orgConfirmPassword: '',
  registrationNumber: '',

  otp: '',

  consentIdentity: false,
  consentPrivacy: false,

  goals: [],

  profilePhoto: null,
  coverPhoto: null,
  username: '',
  headline: '',
  generationMode: 'hybrid',

  journeyStage: '',
  fieldOfStudy: '',
  craftArea: '',
}

/** §8.7 ONBOARDING_GOALS, verbatim (14 options). */
export const ONBOARDING_GOALS = [
  'Find employment',
  'Hire talent',
  'Showcase my work',
  'Verify credentials',
  'Build my CV',
  'Build my Portfolio',
  'Network professionally',
  'Sell products or services',
  'Grow my business',
  'Find collaborators',
  'Learn new skills',
  'Mentor others',
  'Showcase my research',
  'Win new clients',
]

/** §8.3 CAREER_STAGE_OPTIONS with human labels for the picker. */
export const CAREER_STAGE_LABELS: Record<CareerStage, string> = {
  learner: 'Learner',
  student: 'Student',
  undergraduate: 'Undergraduate',
  apprentice: 'Apprentice',
  technical_vocational_learner: 'Technical/vocational learner',
  emerging_professional: 'Emerging professional',
  fresh_graduate: 'Fresh graduate',
  job_seeker: 'Job seeker',
  intern: 'Intern',
  national_service_participant: 'National service participant',
  professional: 'Professional',
  freelancer: 'Freelancer',
  entrepreneur: 'Entrepreneur',
  researcher: 'Researcher',
  consultant: 'Consultant',
  skilled_tradesperson: 'Skilled tradesperson',
  career_transition: 'Career transition',
  executive: 'Executive',
  mentor: 'Mentor',
  retired_professional: 'Retired professional',
}

/** §8.8.1 — which journey-setup branch a careerStage triggers. */
export function journeyBranchFor(careerStage: CareerStage | null): 'academic' | 'independent' | null {
  if (!careerStage) return null
  if (['learner', 'student', 'undergraduate', 'technical_vocational_learner'].includes(careerStage)) return 'academic'
  if (careerStage === 'freelancer') return 'independent'
  return null
}
