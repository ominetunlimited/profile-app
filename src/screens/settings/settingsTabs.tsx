import { useEffect, useState, type ReactNode } from 'react'
import { ColourModeSelect } from '@/shared/ui/ColourModeSelect'
import { Link } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { hubForOrgType } from '@/app/accountTypes'
import { useLanguage } from '@/app/LanguageContext'
import { LANGUAGES, type LanguageCode } from '@/app/i18n'
import { changePassword, getAccountVisibility, setAccountVisibility, updateDemoAccount, useAccountsCacheVersion, type ProfileVisibility } from '@/app/demoAccountStore'
import { listActivities, ownerKey } from '@/app/activityStore'
import { confirmTotpEnrollment, listTotpFactors, removeTotpFactor, startTotpEnrollment, type TotpEnrollment, type TotpFactor } from '@/app/mfaStore'
import { listVerificationRequests } from '@/app/verificationRequestStore'
import { KIND_LABEL as REQUEST_KIND_LABEL, listMyDataRequests, submitDataRequest, type DataRequest, type DataRequestKind } from '@/app/dataRequestStore'
import { getCommerceSettings, setCommerceSettings, type CommerceSettings } from '@/app/commerceStore'
import { getAccessibilityPrefs, saveAccessibilityPrefs, type AccessibilityPrefs } from '@/app/accessibilityStore'
import { getProfileMedia, saveAvatar, saveCover } from '@/app/mediaStore'
import { listLoginHistory } from '@/app/sessionStore'
import { getPrivacyMode, setPrivacyMode } from '@/app/privacyModeStore'
import { getMentorshipPreference, setMentorshipPreference } from '@/app/mentorshipStore'
import { getPreference, PREFERENCE_CATEGORIES, setPreference, useNotificationsCacheVersion, type NotificationCategory } from '@/app/notificationStore'
import { Field, PasswordInput, SelectInput, TextInput } from '@/shared/ui/Field'
import { Button } from '@/shared/ui/Button'
import { ImageUploadField } from '@/shared/ui/ImageUploadField'

/** Supports both uncontrolled use (`defaultChecked`, most Settings toggles —
 * decorative in this no-backend build) and controlled use (`checked` +
 * `onChange`, for toggles a real feature — like Store Hub — reads back). */
function Toggle({
  label,
  hint,
  defaultChecked = false,
  checked,
  onChange,
  soon = false,
}: {
  label: string
  hint?: string
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (next: boolean) => void
  /** The control isn't connected to anything yet: shown off, disabled and labelled rather than pretending to save. */
  soon?: boolean
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked)
  const on = soon ? false : (checked ?? uncontrolled)
  function toggle() {
    if (soon) return
    if (onChange) onChange(!on)
    else setUncontrolled((v) => !v)
  }
  return (
    <label className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span>
        <span className="block text-sm text-text-0">
          {label}
          {soon && <span className="ms-2 rounded-full border border-border-strong px-2 py-0.5 text-[10.5px] font-medium text-text-2">Coming soon</span>}
        </span>
        {hint && <span className="block text-xs text-text-1">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        aria-disabled={soon || undefined}
        disabled={soon}
        onClick={toggle}
        className={`h-6 w-11 flex-none rounded-full transition-colors ${soon ? 'cursor-not-allowed opacity-50' : ''} ${on ? 'bg-accent' : 'bg-border-strong'}`}
      >
        <span className={`block h-5 w-5 translate-x-0.5 rounded-full bg-white transition-transform ${on ? 'translate-x-[22px]' : ''}`} />
      </button>
    </label>
  )
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-4">
      <h2 className="mb-1 font-semibold text-text-0">{title}</h2>
      <div>{children}</div>
    </div>
  )
}

/**
 * §25 SETTINGS_TABS.Profile — a real, saved form (a Phase 2 stub previously
 * had uncontrolled `defaultValue` inputs with no save path at all). Patch
 * (pre-Phase-7) adds the header-contact fields the CV builder needs and had
 * nowhere to collect: city/state (§4.1 only ever had `country`), LinkedIn
 * URL, and an external website URL distinct from PROFILE's own `profileUrl`.
 */
export function ProfileTab() {
  const { account, setAccount } = useAccount()
  const isIndividual = account?.accountType === 'individual'
  const owner = account ? ownerKey(account) : ''
  useAccountsCacheVersion()
  const media = owner ? getProfileMedia(owner) : { avatarDataUrl: null, coverDataUrl: null }
  const [photoError, setPhotoError] = useState<string | null>(null)
  const [form, setForm] = useState(() => ({
    legalName: account?.legalName ?? '',
    preferredDisplayName: isIndividual ? account.preferredDisplayName ?? '' : '',
    headline: isIndividual ? account.headline ?? '' : '',
    phone: isIndividual ? account.phone ?? '' : '',
    city: isIndividual ? account.city ?? '' : '',
    stateOrRegion: isIndividual ? account.stateOrRegion ?? '' : '',
    linkedInUrl: isIndividual ? account.linkedInUrl ?? '' : '',
    externalWebsiteUrl: isIndividual ? account.externalWebsiteUrl ?? '' : '',
  }))
  const [saved, setSaved] = useState(false)

  async function save() {
    if (!account || account.accountType !== 'individual') return
    const updated = { ...account, ...form }
    setAccount(updated)
    await updateDemoAccount(account.email, updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <Section title="Profile">
      <div className="flex flex-col gap-3 pt-2">
        <ImageUploadField
          label="Cover image"
          value={media.coverDataUrl}
          maxDimension={1600}
          shape="banner"
          onUploaded={(dataUrl) => {
            setPhotoError(null)
            saveCover(owner, dataUrl).catch((e) => setPhotoError(e instanceof Error ? e.message : 'Could not save your cover image.'))
          }}
        />
        <ImageUploadField
          label={account?.accountType === 'organisation' ? 'Logo' : 'Profile photo'}
          value={media.avatarDataUrl}
          maxDimension={480}
          shape="circle"
          onUploaded={(dataUrl) => {
            setPhotoError(null)
            saveAvatar(owner, dataUrl).catch((e) => setPhotoError(e instanceof Error ? e.message : 'Could not save your photo.'))
          }}
        />
        {photoError && <p role="alert" className="text-xs text-danger">{photoError}</p>}
        <Field label="Full name">
          <TextInput value={form.legalName} onChange={(e) => setForm((f) => ({ ...f, legalName: e.target.value }))} />
        </Field>
        <Field label="Preferred display name" hint="Optional — shown publicly instead of your legal name if Privacy → Private Professional Mode is on.">
          <TextInput value={form.preferredDisplayName} onChange={(e) => setForm((f) => ({ ...f, preferredDisplayName: e.target.value }))} placeholder="If different from your full name" />
        </Field>
        <Field label="Headline">
          <TextInput value={form.headline} onChange={(e) => setForm((f) => ({ ...f, headline: e.target.value }))} placeholder="e.g. Structural Engineer" />
        </Field>
        <Field label="Phone" hint="Optional — auto-populates your CV header.">
          <TextInput value={form.phone} onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+234 800 000 0000" />
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="City">
            <TextInput value={form.city} onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))} />
          </Field>
          <Field label="State / region">
            <TextInput value={form.stateOrRegion} onChange={(e) => setForm((f) => ({ ...f, stateOrRegion: e.target.value }))} />
          </Field>
        </div>
        <Field label="LinkedIn URL" hint="Optional — auto-populates your CV header.">
          <TextInput value={form.linkedInUrl} onChange={(e) => setForm((f) => ({ ...f, linkedInUrl: e.target.value }))} placeholder="linkedin.com/in/…" />
        </Field>
        <Field label="External website / GitHub" hint="Distinct from your PROFILE URL — your own site, listed alongside it, not instead of it.">
          <TextInput value={form.externalWebsiteUrl} onChange={(e) => setForm((f) => ({ ...f, externalWebsiteUrl: e.target.value }))} placeholder="yoursite.com" />
        </Field>
        {!isIndividual && <p className="text-xs text-text-1">These fields apply to individual accounts.</p>}
        <div className="flex items-center gap-3">
          <Button disabled={!isIndividual} onClick={save}>
            Save profile
          </Button>
          {saved && <span className="text-xs text-success">Saved.</span>}
        </div>
      </div>
    </Section>
  )
}

/** Who can find and view your profile. Saved on your account and enforced by the database. */
function ProfileVisibilityControl() {
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  useAccountsCacheVersion()
  const current = getAccountVisibility(owner)
  const [error, setError] = useState<string | null>(null)
  const [saved, setSaved] = useState(false)
  const options: { value: ProfileVisibility; label: string; hint: string }[] = [
    { value: 'private', label: 'Private', hint: "Only you, people you're connected with and people you message. You don't appear in search." },
    { value: 'discoverable', label: 'Verified organisations', hint: "Recruiters and institutions PROFILE has verified can find you, as well as your connections." },
    { value: 'public', label: 'Public', hint: "Anyone can find and view your profile, signed in or not." },
  ]
  return (
    <div className="border-b border-border py-3">
      <div className="mb-1 text-sm text-text-0">Profile visibility</div>
      <div className="mb-2 text-xs text-text-1">Who can find and view your profile and the activity you've made public.</div>
      <div role="radiogroup" aria-label="Profile visibility" className="flex flex-col gap-2">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={current === o.value}
            onClick={() => {
              setError(null)
              setSaved(false)
              setAccountVisibility(o.value).then(() => setSaved(true)).catch((e: Error) => setError(e.message))
            }}
            className={`rounded-lg border-[1.5px] px-3 py-2 text-left ${current === o.value ? 'border-accent bg-accent-soft' : 'border-border bg-surface'}`}
          >
            <span className="block text-xs font-semibold text-text-0">{o.label}</span>
            <span className="block text-[11.5px] text-text-1">{o.hint}</span>
          </button>
        ))}
      </div>
      {saved && <p className="mt-1.5 text-xs text-success">Saved.</p>}
      {error && (
        <p role="alert" className="mt-1.5 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** §25 SETTINGS_TABS.PrivacyAndVisibility + §25.1 PrivacyMode */
export function PrivacyTab() {
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  const [privacyMode, setPrivacyModeState] = useState(() => (owner ? getPrivacyMode(owner) : { legalNamePublicVisibility: 'public' as const }))

  return (
    <div className="flex flex-col gap-4">
      {account?.accountType === 'individual' && (
        <Section title="Private Professional Mode">
          <p className="mb-2 text-xs text-text-1">
            For anyone whose primary occupation can't be publicly named. Turning this on never weakens your Verified
            Identity badge or Trust Score — it just stops disclosing which legal name was verified.
          </p>
          <Toggle
            label="Keep my legal name private"
            hint={account.preferredDisplayName ? `Visitors will see "${account.preferredDisplayName}" instead.` : 'Add a preferred display name below, or your legal name will still show.'}
            checked={privacyMode.legalNamePublicVisibility === 'private'}
            onChange={(v) => {
              const next = { legalNamePublicVisibility: (v ? 'private' : 'public') as 'public' | 'private' }
              setPrivacyModeState(next)
              setPrivacyMode(owner, next)
            }}
          />
        </Section>
      )}
      <Section title="Visibility">
        <p className="mb-1 text-xs text-text-1">
          Each record you post already has its own visibility (public, connections only or private). Account-wide controls arrive with the visibility engine, so they are not switchable yet.
        </p>
        <ProfileVisibilityControl />
        <Toggle soon label="Credential visibility" hint="Show verified credentials to visitors." />
        <Toggle soon label="Trust Passport visibility" hint="Allow sharing your Trust Passport via link." />
        <Toggle soon label="Search engine indexing" hint="Whether your public profile appears in search results." />
        <Toggle soon label="Recruiter access" hint="Whether organisations can discover you for roles." />
      </Section>
      <Section title="CV visibility">
        <p className="mb-2 text-xs text-text-1">Who can see your CV. Coming soon — your CV is currently shared only where you choose to attach it.</p>
        <SelectInput defaultValue="public" disabled aria-label="CV visibility (coming soon)">
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="organisations_only">Organisations only</option>
        </SelectInput>
      </Section>
      <Section title="Identity presentation mode">
        <p className="mb-2 text-xs text-text-1">Changes what's shown, never the underlying verified evidence. Coming soon.</p>
        <SelectInput defaultValue="standard" disabled aria-label="Identity presentation mode (coming soon)">
          <option value="standard">Standard — full profile</option>
          <option value="portfolio_only">Portfolio only — identity/contact suppressed</option>
          <option value="recruiter_mode">Recruiter mode</option>
          <option value="founder_mode">Founder mode</option>
          <option value="anonymous_browsing">Anonymous browsing</option>
        </SelectInput>
      </Section>
    </div>
  )
}

/** §25 SETTINGS_TABS.Notifications — real, persisted per-category preferences
 * (public.notification_preferences) that the server-side engine consults before
 * delivering anything. Security/system notices are locked on. Email and push
 * are stored as preferences but no delivery provider is configured on this
 * deployment, so those switches say so instead of pretending to send. */
export function NotificationsTab() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  useNotificationsCacheVersion()
  const [error, setError] = useState<string | null>(null)

  async function update(category: NotificationCategory, patch: { inApp?: boolean; email?: boolean; push?: boolean }) {
    setError(null)
    try {
      await setPreference(owner, category, patch)
    } catch {
      setError('Could not save that preference. Please try again.')
    }
  }

  return (
    <Section title="Notifications">
      <p className="mb-3 text-xs text-text-1">
        Choose what reaches you inside PROFILE. Email and push delivery aren't configured on this deployment yet, so only in-app notifications are
        sent today — your email/push choices are saved for when they are.
      </p>
      {error && (
        <p role="alert" className="mb-2 text-xs text-danger">
          {error}
        </p>
      )}
      <div className="divide-y divide-border">
        {PREFERENCE_CATEGORIES.map((c) => {
          const pref = getPreference(c.category)
          return (
            <div key={c.category} className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
              <div className="min-w-[200px] flex-1">
                <div className="text-sm font-medium text-text-0">{c.label}</div>
                <div className="text-xs text-text-2">{c.description}</div>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <label className="flex items-center gap-1.5">
                  <input type="checkbox" checked={pref.inApp} disabled={c.locked} onChange={(e) => void update(c.category, { inApp: e.target.checked })} aria-label={`${c.label}: in-app`} />
                  In-app
                </label>
                <label className="flex items-center gap-1.5 text-text-2" title="Email delivery isn't configured on this deployment">
                  <input type="checkbox" checked={pref.email} onChange={(e) => void update(c.category, { email: e.target.checked })} aria-label={`${c.label}: email`} />
                  Email
                </label>
                <label className="flex items-center gap-1.5 text-text-2" title="Push delivery isn't configured on this deployment">
                  <input type="checkbox" checked={pref.push} onChange={(e) => void update(c.category, { push: e.target.checked })} aria-label={`${c.label}: push`} />
                  Push
                </label>
              </div>
            </div>
          )
        })}
      </div>
    </Section>
  )
}

/** §25 SETTINGS_TABS.CVAndExport */
export function CvExportTab() {
  return (
    <Section title="CV & export">
      <div className="flex flex-col gap-3 pt-2">
        <Field label="Template preference">
          <SelectInput defaultValue="Modern Professional" disabled aria-label="Template preference (coming soon)">
            {['Executive', 'Corporate', 'Modern Professional', 'Minimalist', 'Creative'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Portfolio default view mode" hint="Only applies to a visitor who hasn't already picked their own view mode.">
          <SelectInput defaultValue="grid" disabled aria-label="Portfolio default view mode (coming soon)">
            <option value="thumbnail">Thumbnail</option>
            <option value="grid">Grid</option>
            <option value="card_flip">Card flip</option>
          </SelectInput>
        </Field>
        <Toggle soon label="Auto-include new evidence" hint="New verified activity is added to your CV automatically" />
        <p className="text-xs text-text-1">Template and view-mode defaults arrive soon; today you pick them on the CV and Portfolio pages.</p>
      </div>
    </Section>
  )
}

/** §25 SETTINGS_TABS.CareerJourney */
export function CareerJourneyTab() {
  const { account, setAccount } = useAccount()
  const [saved, setSaved] = useState(false)
  async function changeStage(value: string) {
    if (!account || account.accountType !== 'individual') return
    const updated = { ...account, careerStage: (value || undefined) as typeof account.careerStage }
    setAccount(updated)
    await updateDemoAccount(account.email, updated)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }
  return (
    <Section title="Career journey">
      <div className="flex flex-col gap-3 pt-2">
        <Field label="Career stage">
          <SelectInput value={account?.accountType === 'individual' ? account.careerStage ?? '' : ''} onChange={(e) => void changeStage(e.target.value)}>
            <option value="">Not set</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="freelancer">Freelancer</option>
          </SelectInput>
        </Field>
        <p className="text-xs text-text-1">Update as you progress — set once at onboarding, editable here anytime.{saved && <span className="ms-2 text-success">Saved.</span>}</p>
      </div>
    </Section>
  )
}

/** §25 SETTINGS_TABS.CommerceAndSelling */
export function CommerceTab() {
  const { account } = useAccount()
  const owner = ownerKey(account)
  const [settings, setSettings] = useState(() => getCommerceSettings(owner))

  function update(patch: Partial<CommerceSettings>) {
    const next = { ...settings, ...patch }
    setSettings(next)
    setCommerceSettings(owner, next)
  }

  return (
    <Section title="Commerce & selling">
      <Toggle
        label="Activate my store"
        hint="Sell digital products, physical goods, or services on the Marketplace"
        checked={settings.storeActivated}
        onChange={(storeActivated) => update({ storeActivated, sellingActivated: storeActivated ? settings.sellingActivated : false })}
      />
      <Toggle
        label="Accept payments"
        hint="Requires store activation and accepted commerce terms"
        checked={settings.sellingActivated}
        onChange={(sellingActivated) => update({ sellingActivated: settings.storeActivated && sellingActivated })}
      />
      {settings.storeActivated && (
        <p className="pt-2 text-xs text-success">
          Store activated — the Create Store section is now visible in <span className="font-semibold">Store Hub</span>.
        </p>
      )}
    </Section>
  )
}

/** §25 SETTINGS_TABS.AIAssistant */
export function AiAssistantTab() {
  return (
    <Section title="AI Assistant">
      <p className="mb-1 text-xs text-text-1">PROFILE Advisor only reads what you paste or open in it, and never invents a credential or achievement. Account-wide AI controls are coming.</p>
      <Toggle soon label="Enable PROFILE Advisor" hint="Personal AI professional agent — fully optional." />
      <Toggle soon label="Suggested actions on Home" hint="Show suggested actions on Home." />
      <Toggle soon label="AI data usage disclosure acknowledged" />
    </Section>
  )
}

/** §25 SETTINGS_TABS.Mentorship — previously an uncontrolled toggle and an
 * uncontrolled number field with no store behind either (a real dead-toggle
 * gap, §5 of the V9 Unified Ecosystem Patch); now real, persisted state that
 * actually controls mentor discoverability (mentorshipStore.ts). */
export function MentorshipTab() {
  const { account } = useAccount()
  const owner = account ? ownerKey(account) : ''
  const [pref, setPref] = useState(() => getMentorshipPreference(owner))

  return (
    <Section title="Mentorship">
      <Toggle
        label="Open to mentoring"
        hint="Makes you discoverable as an available mentor and lets others send you mentee requests"
        checked={pref.openToMentoring}
        onChange={(next) => {
          setMentorshipPreference(owner, { openToMentoring: next })
          setPref(getMentorshipPreference(owner))
        }}
      />
      {pref.openToMentoring && (
        <Field label="Mentee capacity">
          <TextInput
            type="number"
            value={pref.menteeCapacity}
            min={0}
            onChange={(e) => {
              const menteeCapacity = Math.max(0, Number(e.target.value) || 0)
              setMentorshipPreference(owner, { menteeCapacity })
              setPref(getMentorshipPreference(owner))
            }}
          />
        </Field>
      )}
    </Section>
  )
}

/** §25 SETTINGS_TABS.Security */
/**
 * §7.4 Session Management. Previously entirely decorative: uncontrolled
 * password inputs with no save handler, uncontrolled MFA toggles, and a
 * hardcoded "no other sessions" sentence that never read any real state.
 * Password change and the login-history log are now real; Authenticator/
 * Passkeys stay honestly labelled as needing a backend this build doesn't
 * have (same pattern as SignInForm's Social Auth buttons) rather than
 * pretending to toggle a real TOTP/WebAuthn enrollment.
 */
export function SecurityTab() {
  const { account } = useAccount()
  const email = account ? ownerKey(account) : ''
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [history, setHistory] = useState(() => listLoginHistory(email))

  async function submitPasswordChange() {
    if (!account) return
    const ok = await changePassword(email, currentPassword, newPassword)
    setPasswordMessage(ok ? 'Password updated.' : 'Current password is incorrect.')
    if (ok) {
      setCurrentPassword('')
      setNewPassword('')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <Section title="Password & recovery">
        <div className="flex flex-col gap-3 pt-2">
          <Field label="Current password">
            <PasswordInput value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} />
          </Field>
          <Field label="New password" hint="At least 8 characters, with uppercase, lowercase, a number, and a symbol.">
            <PasswordInput showStrength value={newPassword} onChange={(e) => setNewPassword(e.target.value)} />
          </Field>
          <div className="flex items-center gap-3">
            <Button disabled={!currentPassword || !newPassword} onClick={submitPasswordChange}>
              Update password
            </Button>
            {passwordMessage && <span className="text-xs text-text-1">{passwordMessage}</span>}
          </div>
        </div>
      </Section>
      <Section title="Multi-factor authentication">
        <AuthenticatorApp />
        <Toggle soon label="Passkeys (WebAuthn)" hint="Sign in with your device instead of a password." />
      </Section>
      <Section title="Sessions & devices">
        {history.length === 0 ? (
          <p className="text-sm text-text-1">No sign-ins recorded yet on this device.</p>
        ) : (
          <div className="flex flex-col gap-2 pt-2">
            {history.map((h, i) => (
              <div key={h.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                <span className="text-text-0">
                  {h.device} {i === 0 && <span className="text-xs text-success">· this session</span>}
                </span>
                <span className="text-xs text-text-2">{new Date(h.signedInAt).toLocaleString()}</span>
              </div>
            ))}
            <p className="mt-1 text-xs text-text-2">
              Only sign-ins on this device are listed. Sessions on other devices are not tracked yet.
            </p>
          </div>
        )}
        <button onClick={() => setHistory(listLoginHistory(email))} className="mt-2 text-xs font-semibold text-accent">
          Refresh
        </button>
      </Section>
    </div>
  )
}

/** §25 SETTINGS_TABS.LanguageAndRegion */
/**
 * §30.2's real Phase 1 Languages (10) — corrected from an earlier 7-language
 * guess sourced from §25's own (incomplete) `phase1Languages` field before
 * §30, the dedicated globalisation section, was read. This is also the one
 * settings control in this build wired to a real effect: changing it
 * actually switches `useLanguage()`, flips `dir` for Arabic, and re-renders
 * every translated string live (§30.1: "full i18n... not an afterthought").
 */
export function LanguageTab() {
  const { language, setLanguage, t } = useLanguage()
  return (
    <Section title={t('settings.language')}>
      <div className="flex flex-col gap-3 pt-2">
        <Field label="Primary language" hint="Changes the app language immediately, including RTL layout for Arabic.">
          <SelectInput value={language} onChange={(e) => setLanguage(e.target.value as LanguageCode)}>
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.native} ({l.label})
              </option>
            ))}
          </SelectInput>
        </Field>
        <p className="text-xs text-text-1">
          Full translation coverage is applied to primary navigation, the Public Hero, and this selector so far —
          the mechanism is real and complete; extending it across every remaining screen is a mechanical
          follow-up now that this infrastructure exists, not a design gap.
        </p>
      </div>
    </Section>
  )
}

/** §25 SETTINGS_TABS.Accessibility */
export function AccessibilityTab() {
  const [prefs, setPrefs] = useState(getAccessibilityPrefs)

  function update(next: AccessibilityPrefs) {
    setPrefs(next)
    saveAccessibilityPrefs(next)
    window.dispatchEvent(new Event('accessibility-prefs-changed'))
  }

  return (
    <Section title="Accessibility">
      <Field label="Colour mode" hint="Light, dark, or follow your device. Applies everywhere in PROFILE, including the public pages.">
        <ColourModeSelect className="h-10 w-full" />
      </Field>
      <Toggle
        label="Reduce motion"
        hint="Stops PROFILE's own animations (including the brand loading motion), regardless of your OS setting."
        checked={prefs.reduceMotion}
        onChange={(v) => update({ ...prefs, reduceMotion: v })}
      />
      <Toggle
        label="High contrast mode"
        hint="Strengthens borders and secondary text against the background."
        checked={prefs.highContrast}
        onChange={(v) => update({ ...prefs, highContrast: v })}
      />
      <Toggle
        label="Screen reader optimisations"
        hint="Keeps the skip-to-content link always visible and widens focus rings."
        checked={prefs.screenReaderOptimised}
        onChange={(v) => update({ ...prefs, screenReaderOptimised: v })}
      />
      <Field label="Text size">
        <SelectInput value={prefs.textSize} onChange={(e) => update({ ...prefs, textSize: e.target.value as AccessibilityPrefs['textSize'] })}>
          <option value="default">Default</option>
          <option value="large">Large</option>
          <option value="larger">Larger</option>
        </SelectInput>
      </Field>
    </Section>
  )
}

/** Data rights: a real download of your own data, plus auditable correction / consent / appeal / deletion requests. */
export function DataRightsTab() {
  const { account } = useAccount()
  const email = account ? ownerKey(account) : ''
  const [requests, setRequests] = useState<DataRequest[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [pending, setPending] = useState<DataRequestKind | null>(null)
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  const [details, setDetails] = useState<Partial<Record<DataRequestKind, string>>>({})

  useEffect(() => {
    let live = true
    listMyDataRequests()
      .then((r) => live && setRequests(r))
      .catch(() => live && setError('Could not load your requests.'))
    return () => {
      live = false
    }
  }, [])

  function downloadMyData() {
    const payload = {
      exportedAt: new Date().toISOString(),
      account,
      activities: listActivities(email),
      verificationRequests: listVerificationRequests(email),
    }
    const url = URL.createObjectURL(new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' }))
    const a = document.createElement('a')
    a.href = url
    a.download = `profile-data-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  async function submit(kind: DataRequestKind) {
    setError(null)
    setPending(kind)
    try {
      const created = await submitDataRequest(email, kind, details[kind])
      setRequests((r) => [created, ...(r ?? [])])
      setDetails((d) => ({ ...d, [kind]: '' }))
      setConfirmingDelete(false)
    } catch {
      setError('Could not submit that request. Please try again.')
    } finally {
      setPending(null)
    }
  }

  const rows: { kind: Exclude<DataRequestKind, 'delete'>; label: string; hint: string; placeholder: string }[] = [
    { kind: 'correction', label: 'Request correction', hint: 'Ask us to correct inaccurate account data.', placeholder: 'What should be corrected?' },
    { kind: 'withdraw_consent', label: 'Withdraw consent', hint: 'Revoke a previously granted consent.', placeholder: 'Which consent are you withdrawing?' },
    { kind: 'appeal', label: 'Appeal a decision', hint: 'Dispute a verification or moderation outcome.', placeholder: 'Which decision, and why?' },
  ]

  return (
    <Section title="Data rights">
      <div className="flex flex-col gap-3 pt-2">
        <div className="flex items-center justify-between gap-3 border-b border-border py-2">
          <span>
            <span className="block text-sm text-text-0">Export your data</span>
            <span className="block text-xs text-text-1">Download your account details, recorded activities and verification history as a JSON file.</span>
          </span>
          <button onClick={downloadMyData} className="flex-none rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-0">
            Download
          </button>
        </div>
        {rows.map((r) => (
          <div key={r.kind} className="border-b border-border py-2">
            <div className="mb-1.5">
              <span className="block text-sm text-text-0">{r.label}</span>
              <span className="block text-xs text-text-1">{r.hint}</span>
            </div>
            <div className="flex gap-2">
              <input
                value={details[r.kind] ?? ''}
                onChange={(e) => setDetails((d) => ({ ...d, [r.kind]: e.target.value }))}
                placeholder={r.placeholder}
                aria-label={r.label}
                className="min-h-[36px] min-w-0 flex-1 rounded-lg border border-border-strong bg-surface px-3 text-xs outline-none focus-visible:border-accent"
              />
              <button
                disabled={pending === r.kind || !(details[r.kind] ?? '').trim()}
                onClick={() => void submit(r.kind)}
                className="flex-none rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-0 disabled:opacity-50"
              >
                {pending === r.kind ? 'Sending…' : 'Submit'}
              </button>
            </div>
          </div>
        ))}
        <div className="flex items-center justify-between gap-3 pt-1">
          <span>
            <span className="block text-sm text-danger">Delete account</span>
            <span className="block text-xs text-text-1">Removes your personal data. Records that institutions or employers independently verified may remain in their own systems.</span>
          </span>
          <button onClick={() => setConfirmingDelete(true)} className="flex-none rounded-lg border border-danger px-3 py-1.5 text-xs font-semibold text-danger">
            Start deletion
          </button>
        </div>
        {confirmingDelete && (
          <div role="alertdialog" aria-label="Confirm account deletion request" className="rounded-lg border border-danger bg-surface-sunken p-3 text-sm text-text-0">
            <p className="mb-2">This sends a deletion request for review. Your account stays active until it is approved, and you will be notified.</p>
            <div className="flex gap-2">
              <button disabled={pending === 'delete'} onClick={() => void submit('delete')} className="rounded-lg border border-danger px-3 py-1.5 text-xs font-semibold text-danger disabled:opacity-50">
                {pending === 'delete' ? 'Sending…' : 'Send deletion request'}
              </button>
              <button onClick={() => setConfirmingDelete(false)} className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-0">
                Cancel
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
        {requests && requests.length > 0 && (
          <div>
            <div className="mb-1.5 text-xs font-semibold text-text-0">Your requests</div>
            <ul className="divide-y divide-border rounded-lg border border-border">
              {requests.map((r) => (
                <li key={r.id} className="flex items-center justify-between gap-3 px-3 py-2 text-xs">
                  <span className="min-w-0">
                    <span className="block font-medium text-text-0">{REQUEST_KIND_LABEL[r.kind]}</span>
                    <span className="block text-text-2">Requested {new Date(r.createdAt).toLocaleDateString()}</span>
                  </span>
                  <span className="flex-none rounded-full border border-border-strong px-2 py-0.5 font-medium capitalize text-text-1">{r.status.replace('_', ' ')}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </Section>
  )
}

/** Authenticator-app (TOTP) two-factor: set up, confirm with a code, remove. */
function AuthenticatorApp() {
  const [factors, setFactors] = useState<TotpFactor[] | null>(null)
  const [enrolment, setEnrolment] = useState<TotpEnrollment | null>(null)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function refresh() {
    try {
      setFactors(await listTotpFactors())
    } catch {
      setFactors([])
    }
  }
  useEffect(() => {
    void refresh()
  }, [])

  async function begin() {
    setBusy(true)
    setError(null)
    try {
      setEnrolment(await startTotpEnrollment())
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }
  async function confirm() {
    if (!enrolment) return
    setBusy(true)
    setError(null)
    try {
      await confirmTotpEnrollment(enrolment.factorId, code)
      setEnrolment(null)
      setCode('')
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }
  async function remove(id: string) {
    setBusy(true)
    setError(null)
    try {
      await removeTotpFactor(id)
      await refresh()
    } catch (e) {
      setError((e as Error).message)
    }
    setBusy(false)
  }

  const enabled = (factors?.length ?? 0) > 0
  return (
    <div className="border-b border-border py-3">
      <div className="flex items-center justify-between gap-4">
        <span>
          <span className="block text-sm text-text-0">Authenticator app</span>
          <span className="block text-xs text-text-1">
            {enabled ? 'On — you will be asked for a 6-digit code every time you sign in.' : 'Use an authenticator app for a 6-digit code at sign-in.'}
          </span>
        </span>
        {factors !== null && !enrolment && (enabled ? (
          <button disabled={busy} onClick={() => void remove(factors[0].id)} className="flex-none rounded-lg border border-danger px-3 py-1.5 text-xs font-semibold text-danger disabled:opacity-50">
            Turn off
          </button>
        ) : (
          <button disabled={busy} onClick={() => void begin()} className="flex-none rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-0 disabled:opacity-50">
            Set up
          </button>
        ))}
      </div>
      {enrolment && (
        <div className="mt-3 flex flex-col gap-3 rounded-lg border border-border bg-surface-sunken p-3">
          <p className="text-xs text-text-1">Scan this with Google Authenticator, 1Password, Authy or similar, then enter the 6-digit code it shows.</p>
          <img src={enrolment.qrCode} alt="Authenticator QR code" className="h-40 w-40 rounded-lg bg-white p-2" />
          <p className="text-xs text-text-1">
            Can't scan? Enter this key instead: <span className="select-all font-mono text-text-0">{enrolment.secret}</span>
          </p>
          <div className="flex gap-2">
            <input
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
              inputMode="numeric"
              placeholder="000000"
              aria-label="6-digit code"
              className="w-32 rounded-lg border border-border-strong bg-surface px-3 py-2 text-center font-mono text-sm tracking-widest outline-none focus-visible:border-accent"
            />
            <button disabled={busy || code.length !== 6} onClick={() => void confirm()} className="rounded-lg bg-accent-solid px-3 py-2 text-xs font-semibold text-white disabled:opacity-50">
              Turn on
            </button>
            <button disabled={busy} onClick={() => { setEnrolment(null); setCode(''); setError(null) }} className="rounded-lg border border-border-strong px-3 py-2 text-xs font-semibold text-text-0">
              Cancel
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-xs text-danger">
          {error}
        </p>
      )}
    </div>
  )
}

/** §25 SETTINGS_TABS.PremiumPlans */
/** §32.1/§32.2 plan contents, verbatim — individual vs organisation. */
const INDIVIDUAL_PLAN_COLUMNS: { name: string; features: string[] }[] = [
  {
    name: 'Free',
    features: [
      'Basic verification requests',
      'Profile & CV builder',
      'Record work',
      'Basic discovery',
      'Connections-only messaging',
      'PROFILE Advisor (AI assistant)',
      'Career Readiness Engine',
      'Smart job recommendations',
    ],
  },
  {
    name: 'Professional',
    features: [
      'Unlimited verification requests',
      'Credential passport',
      'Verification analytics',
      'Priority discovery ranking',
      'Message anyone',
      'PDF export',
      'Multiple CV versions',
      'Advanced analytics',
    ],
  },
  { name: 'Enterprise', features: ['API access', 'White-label trust badge', 'Dedicated support'] },
]

const ORG_PLAN_COLUMNS: { name: string; features: string[] }[] = [
  { name: 'Free', features: ['Limited schemas', 'Limited records', 'Manual verification'] },
  { name: 'Professional', features: ['Unlimited schemas', 'Bulk uploads', 'Automated verification', 'Analytics'] },
  { name: 'Enterprise', features: ['API integration', 'Real-time sync', 'SSO', 'Compliance tools', 'Dedicated infrastructure', 'SLA'] },
]

export function PremiumPlansTab() {
  const { account } = useAccount()
  const columns = account?.accountType === 'organisation' ? ORG_PLAN_COLUMNS : INDIVIDUAL_PLAN_COLUMNS
  return (
    <Section title="Premium plans">
      <p className="mb-3 text-sm text-text-1">Verification is never paywalled. Premium adds visibility and convenience — never gates trust itself.</p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {columns.map((plan, i) => (
          <div key={plan.name} className={`rounded-lg border p-3 ${i === 1 ? 'border-accent' : 'border-border'}`}>
            <div className="mb-1.5 font-semibold text-text-0">{plan.name}</div>
            <ul className="flex flex-col gap-1">
              {plan.features.map((f) => (
                <li key={f} className="text-xs text-text-1">
                  {f}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <p className="mt-3 text-xs text-text-2">
        Paid plans are not available to buy yet. This is an accurate comparison of what each plan will include.
      </p>
    </Section>
  )
}

/** §25.2 Organisation Settings — parallel structure, organisation accounts only. */
export function OrganisationTab() {
  const { account } = useAccount()
  if (account?.accountType !== 'organisation') return null
  const hub = hubForOrgType(account.orgType)

  return (
    <div className="flex flex-col gap-4">
      <Section title="Workspace">
        <div className="flex flex-col gap-3 pt-2">
          <Field label="Organisation name">
            <TextInput defaultValue={account.legalName} />
          </Field>
          <Field label="Official email">
            <TextInput defaultValue={account.officialEmail} />
          </Field>
        </div>
        <p className="mt-2 text-xs text-text-1">
          Registry status: <span className="font-mono">{account.registryLevel}</span> · Type: {account.orgType}
        </p>
      </Section>
      <Section title="Team & roles">
        <p className="text-sm text-text-1">
          No staff invited yet — inviting staff needs a real matching-email registration flow this build doesn't
          have.
        </p>
      </Section>
      {hub === 'institutional_hub' && (
        <Section title="Verification schemas">
          <p className="mb-2 text-sm text-text-1">Define what your institution verifies, and how records are matched at scale.</p>
          <Link to={`/institution/${account.officialEmail}/schemas`} className="text-sm font-semibold text-accent">
            Open Schema Builder →
          </Link>
        </Section>
      )}
      <Section title="Billing">
        <p className="text-sm text-text-1">
          Plan management, invoice history, and payout details render here once real billing exists — no
          fabricated invoices in the meantime.
        </p>
      </Section>
    </div>
  )
}
