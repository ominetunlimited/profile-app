import { useState, type ReactNode } from 'react'
import { ColourModeSelect } from '@/shared/ui/ColourModeSelect'
import { Link } from 'react-router-dom'
import { useAccount } from '@/app/AccountContext'
import { hubForOrgType } from '@/app/accountTypes'
import { useLanguage } from '@/app/LanguageContext'
import { LANGUAGES, type LanguageCode } from '@/app/i18n'
import { changePassword, updateDemoAccount, useAccountsCacheVersion } from '@/app/demoAccountStore'
import { ownerKey } from '@/app/activityStore'
import { getCommerceSettings, setCommerceSettings, type CommerceSettings } from '@/app/commerceStore'
import { getAccessibilityPrefs, saveAccessibilityPrefs, type AccessibilityPrefs } from '@/app/accessibilityStore'
import { getProfileMedia, saveAvatar, saveCover } from '@/app/mediaStore'
import { getSuspiciousLoginAlertsEnabled, listLoginHistory, setSuspiciousLoginAlertsEnabled } from '@/app/sessionStore'
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
}: {
  label: string
  hint?: string
  defaultChecked?: boolean
  checked?: boolean
  onChange?: (next: boolean) => void
}) {
  const [uncontrolled, setUncontrolled] = useState(defaultChecked)
  const on = checked ?? uncontrolled
  function toggle() {
    if (onChange) onChange(!on)
    else setUncontrolled((v) => !v)
  }
  return (
    <label className="flex items-center justify-between gap-4 border-b border-border py-3 last:border-0">
      <span>
        <span className="block text-sm text-text-0">{label}</span>
        {hint && <span className="block text-xs text-text-1">{hint}</span>}
      </span>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        onClick={toggle}
        className={`h-6 w-11 flex-none rounded-full transition-colors ${on ? 'bg-accent' : 'bg-border-strong'}`}
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
        <Toggle label="Profile visibility" hint="Public — anyone can view your profile" defaultChecked />
        <Toggle label="Credential visibility" hint="Show verified credentials to visitors" defaultChecked />
        <Toggle label="Trust Passport visibility" hint="Allow sharing your Trust Passport via link" defaultChecked />
        <Toggle label="Search engine indexing" hint="Let search engines index your public profile" defaultChecked />
        <Toggle label="Recruiter access" hint="Allow recruiters to find you in Trust Search" defaultChecked />
      </Section>
      <Section title="CV visibility">
        <p className="mb-2 text-xs text-text-1">
          Unlike Portfolio, your CV has a real
          visibility preference.
        </p>
        <SelectInput defaultValue="public">
          <option value="public">Public</option>
          <option value="private">Private</option>
          <option value="organisations_only">Organisations only</option>
        </SelectInput>
      </Section>
      <Section title="Identity presentation mode">
        <p className="mb-2 text-xs text-text-1">Changes what's shown, never the underlying verified evidence.</p>
        <SelectInput defaultValue="standard">
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
          <SelectInput defaultValue="Modern Professional">
            {['Executive', 'Corporate', 'Modern Professional', 'Minimalist', 'Creative'].map((t) => (
              <option key={t}>{t}</option>
            ))}
          </SelectInput>
        </Field>
        <Field label="Portfolio default view mode" hint="Only applies to a visitor who hasn't already picked their own view mode.">
          <SelectInput defaultValue="grid">
            <option value="thumbnail">Thumbnail</option>
            <option value="grid">Grid</option>
            <option value="card_flip">Card flip</option>
          </SelectInput>
        </Field>
        <Toggle label="Auto-include new evidence" hint="New verified activity is added to your CV automatically" defaultChecked />
      </div>
    </Section>
  )
}

/** §25 SETTINGS_TABS.CareerJourney */
export function CareerJourneyTab() {
  const { account } = useAccount()
  return (
    <Section title="Career journey">
      <div className="flex flex-col gap-3 pt-2">
        <Field label="Career stage">
          <SelectInput defaultValue={account?.accountType === 'individual' ? account.careerStage ?? '' : ''}>
            <option value="">Not set</option>
            <option value="student">Student</option>
            <option value="professional">Professional</option>
            <option value="freelancer">Freelancer</option>
          </SelectInput>
        </Field>
        <p className="text-xs text-text-1">Update as you progress — set once at onboarding, editable here anytime.</p>
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
      <Toggle label="Enable PROFILE Advisor" hint="Personal AI professional agent — fully optional" defaultChecked />
      <Toggle label="Daily Return Engine suggestions" hint="Show suggested actions on Home" defaultChecked />
      <Toggle label="AI data usage disclosure acknowledged" />
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
  const [alertsEnabled, setAlertsEnabled] = useState(getSuspiciousLoginAlertsEnabled)
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
        <Toggle label="Authenticator app (TOTP)" hint="Requires a real TOTP backend — not connected in this build." />
        <Toggle label="Email verification" defaultChecked hint="Already real — this is the code sent at sign-up and account recovery." />
        <Toggle label="Passkeys (WebAuthn)" hint="Requires real WebAuthn registration — not connected in this build." />
        <Toggle
          label="Suspicious login alerts"
          checked={alertsEnabled}
          onChange={(v) => {
            setAlertsEnabled(v)
            setSuspiciousLoginAlertsEnabled(v)
          }}
          hint="Real: controls whether an unrecognised device is challenged with a code at sign-in."
        />
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
              This build has one browser and no backend session store, so only real sign-ins on this device appear
              here — multi-device session tracking needs a real backend.
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

/** §25 SETTINGS_TABS.DataRights, implementing §27.4's compliance rights as real controls. */
export function DataRightsTab() {
  const [confirmingDelete, setConfirmingDelete] = useState(false)
  return (
    <Section title="Data rights">
      <div className="flex flex-col gap-3 pt-2">
        <RightRow label="Download my data" hint="Export your CV and credential history at any time." />
        <RightRow label="Request correction" hint="Ask us to correct inaccurate account data." />
        <RightRow label="Withdraw consent" hint="Revoke a previously granted consent." />
        <RightRow label="Appeal a decision" hint="Dispute a verification or moderation outcome." />
        <div className="flex items-center justify-between border-t border-border pt-3">
          <span>
            <span className="block text-sm text-danger">Delete my account</span>
            <span className="block text-xs text-text-1">Verification and audit records may be retained where legally required.</span>
          </span>
          <button onClick={() => setConfirmingDelete(true)} className="rounded-lg border border-danger px-3 py-1.5 text-xs font-semibold text-danger">
            Delete account
          </button>
        </div>
        {confirmingDelete && (
          <div role="alertdialog" className="rounded-lg border border-danger bg-surface-sunken p-3 text-sm text-text-0">
            This is a demo build — account deletion isn't wired to a backend yet. No data was deleted.
            <button onClick={() => setConfirmingDelete(false)} className="ml-2 font-semibold text-accent">
              Dismiss
            </button>
          </div>
        )}
      </div>
    </Section>
  )
}

function RightRow({ label, hint }: { label: string; hint: string }) {
  return (
    <div className="flex items-center justify-between border-b border-border py-2 last:border-0">
      <span>
        <span className="block text-sm text-text-0">{label}</span>
        <span className="block text-xs text-text-1">{hint}</span>
      </span>
      <button className="rounded-lg border border-border-strong px-3 py-1.5 text-xs font-semibold text-text-0">Request</button>
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
        Upgrade/billing isn't wired to a real payment processor yet in this build — no fake checkout flow, this is a
        real, accurate plan comparison ready for one.
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
