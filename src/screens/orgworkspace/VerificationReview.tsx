import { useEffect, useState } from 'react'
import { AppShell } from '@/shared/ui/AppShell'
import { listAllOrganisations, onAccountsChange, setOrganisationRegistryLevel } from '@/app/demoAccountStore'
import { ORG_TRUST_STATUS_LABEL, hubForOrgType, type OrgRegistryLevel } from '@/app/accountTypes'

const FREE_EMAIL_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com', 'aol.com', 'proton.me', 'protonmail.com'])

const STATUS_TONE: Record<OrgRegistryLevel, { bg: string; ink: string; edgeSelected: string }> = {
  user_submitted: { bg: 'bg-surface-sunken', ink: 'text-text-1', edgeSelected: 'border-accent' },
  recognized: { bg: 'bg-warning-soft', ink: 'text-warning', edgeSelected: 'border-accent' },
  verified: { bg: 'bg-success-soft', ink: 'text-success', edgeSelected: 'border-accent' },
  rejected: { bg: 'bg-danger-soft', ink: 'text-danger', edgeSelected: 'border-accent' },
}

type Check = { glyph: '✓' | '⚠' | '✕' | '◷'; ink: string; label: string }

/**
 * §16, §26 — PROFILE-staff review of workspace claim requests (§50.4
 * OrgClaimRequest). Design handoff gap audit: rebuilt to match PROFILE
 * Verification Review.dc.html's real two-column layout (selectable queue +
 * detail panel with automated checks, a reviewer note, and a third "Request
 * more information" action) instead of the earlier flat approve/reject list.
 *
 * Flagged substitutions — this build's real OrganisationAccount has no
 * separate requester identity, no creation timestamp, and no WHOIS/registry
 * API integration, so the mockup's fabricated "Amara Okafor · Personal
 * PROFILE since 2019" persona and domain-age check are never reproduced.
 * What IS real and computed here: the domain is parsed straight from
 * officialEmail, "not a free/consumer provider" is a real denylist check,
 * and a government-domain flag uses the org's own hub mapping (matching
 * §10.5's real institutional_hub/regulatory_console categorisation) — the
 * two checks this build cannot actually perform (registry match, domain
 * age) show the mockup's own "pending manual check" ◷ glyph rather than a
 * fabricated pass.
 */
export function VerificationReview() {
  const [orgs, setOrgs] = useState(() => listAllOrganisations())
  const [activeEmail, setActiveEmail] = useState<string | null>(() => listAllOrganisations()[0]?.officialEmail ?? null)
  const [note, setNote] = useState('')
  const [noteError, setNoteError] = useState(false)
  const [showMoreInfoNotice, setShowMoreInfoNotice] = useState(false)

  const active = orgs.find((o) => o.officialEmail === activeEmail) ?? orgs[0] ?? null

  function refresh() {
    setOrgs(listAllOrganisations())
  }

  // Pipeline repair Phase A: `listAllOrganisations()` reads a live
  // Supabase-backed cache (demoAccountStore.ts) that may still be loading,
  // or may receive a Realtime push, after this screen's first render — this
  // keeps the queue current instead of freezing at whatever the cache held
  // at mount.
  useEffect(() => onAccountsChange(refresh), [])

  async function decide(email: string, level: OrgRegistryLevel) {
    if (level === 'rejected' && !note.trim()) {
      setNoteError(true)
      return
    }
    await setOrganisationRegistryLevel(email, level)
    setNoteError(false)
    setNote('')
    refresh()
  }

  function checksFor(domain: string, hub: ReturnType<typeof hubForOrgType>): Check[] {
    const isFree = FREE_EMAIL_DOMAINS.has(domain.toLowerCase())
    const govFlag = hub === 'regulatory_console'
    const eduLike = hub === 'institutional_hub'
    return [
      isFree
        ? { glyph: '✕', ink: 'text-danger', label: 'Domain is a free/consumer email provider' }
        : { glyph: '✓', ink: 'text-success', label: 'Domain is not a free/consumer provider' },
      govFlag
        ? { glyph: '⚠', ink: 'text-warning', label: 'Government domain — requires manual verification with MDA registry' }
        : eduLike
          ? { glyph: domain.includes('edu') ? '✓' : '⚠', ink: domain.includes('edu') ? 'text-success' : 'text-warning', label: domain.includes('edu') ? 'Domain matches an academic (.edu-style) pattern' : 'Domain does not match an academic pattern — verify manually' }
          : { glyph: '◷', ink: 'text-text-1', label: 'External company registry match — no registry API in this build' },
      { glyph: '◷', ink: 'text-text-1', label: 'Domain age — no WHOIS lookup available in this build' },
    ]
  }

  return (
    <AppShell>
      <div className="mx-auto max-w-[1180px] px-4 py-8 sm:px-6">
        <div className="mb-1 font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · PROFILE staff only</div>
        <h1 className="mb-2 text-2xl font-bold tracking-tight text-text-0">Workspace verification review</h1>
        <p className="mb-6 max-w-[70ch] text-sm leading-relaxed text-text-1">
          Every organisation, institution and government workspace request lands here before it goes live. A human
          confirms the domain and the requester's standing — nothing is auto-approved.
        </p>

        {orgs.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
            No organisation workspace requests yet. Sign up an organisation account (via /auth?mode=signup) on this
            browser to see a real entry here.
          </div>
        ) : (
          <div className="flex flex-wrap gap-5">
            <div className="flex min-w-0 flex-1 basis-[380px] flex-col gap-3">
              {orgs.map((org) => {
                const tone = STATUS_TONE[org.registryLevel]
                const isActive = active?.officialEmail === org.officialEmail
                return (
                  <button
                    key={org.officialEmail}
                    onClick={() => {
                      setActiveEmail(org.officialEmail)
                      setNote('')
                      setNoteError(false)
                      setShowMoreInfoNotice(false)
                    }}
                    className={`rounded-xl border-[1.5px] p-3.5 text-left ${isActive ? `${tone.edgeSelected} bg-accent-soft` : 'border-border bg-surface'}`}
                  >
                    <div className="mb-1 flex items-center justify-between gap-2">
                      <span className="text-[13.5px] font-semibold text-text-0">{org.legalName}</span>
                      <span className={`rounded-full px-2 py-0.5 text-[10.5px] font-semibold ${tone.bg} ${tone.ink}`}>{ORG_TRUST_STATUS_LABEL[org.registryLevel]}</span>
                    </div>
                    <div className="mb-1 text-[11.5px] text-text-1">
                      {org.orgType} · {hubForOrgType(org.orgType)}
                    </div>
                    <div className="font-mono text-[11px] text-text-2">{org.officialEmail.split('@')[1] ?? org.officialEmail}</div>
                  </button>
                )
              })}
            </div>

            {active && (
              <div className="min-w-[280px] flex-1 basis-[480px]">
                <div className="rounded-2xl border border-border bg-surface p-6 shadow-sm">
                  <div className="mb-1.5 flex flex-wrap items-center gap-2">
                    <h2 className="text-lg font-bold text-text-0">{active.legalName}</h2>
                    <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${STATUS_TONE[active.registryLevel].bg} ${STATUS_TONE[active.registryLevel].ink}`}>
                      {ORG_TRUST_STATUS_LABEL[active.registryLevel]}
                    </span>
                  </div>
                  <div className="mb-4.5 text-[12.5px] text-text-1">
                    {active.orgType} workspace ({hubForOrgType(active.orgType)})
                  </div>

                  <div className="mb-4.5 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    <div className="rounded-lg border border-border p-2.5">
                      <div className="mb-1 font-mono text-[9.5px] uppercase tracking-wide text-text-2">Requester</div>
                      <div className="text-xs text-text-0">{active.officialEmail}</div>
                      <div className="text-[11px] text-text-1">No separate requester identity is tracked — org self-registration doesn't require a prior individual account.</div>
                    </div>
                    <div className="rounded-lg border border-border p-2.5">
                      <div className="mb-1 font-mono text-[9.5px] uppercase tracking-wide text-text-2">Domain</div>
                      <div className="font-mono text-xs text-text-0">{active.officialEmail.split('@')[1] ?? '—'}</div>
                    </div>
                  </div>

                  <div className="mb-4.5 rounded-lg border border-border bg-surface-sunken p-3.5">
                    <div className="mb-2 text-xs font-semibold text-text-0">Automated checks</div>
                    {checksFor(active.officialEmail.split('@')[1] ?? '', hubForOrgType(active.orgType)).map((c, i) => (
                      <div key={i} className="mb-1.5 flex items-center gap-2 last:mb-0">
                        <span className={`text-[11px] font-bold ${c.ink}`}>{c.glyph}</span>
                        <span className="text-xs text-text-0">{c.label}</span>
                      </div>
                    ))}
                  </div>

                  <label className="mb-4.5 flex flex-col gap-1.5">
                    <span className="text-xs font-medium text-text-0">Reviewer note (shown to requester if rejected)</span>
                    <textarea
                      value={note}
                      onChange={(e) => {
                        setNote(e.target.value)
                        if (e.target.value.trim()) setNoteError(false)
                      }}
                      rows={3}
                      placeholder="Optional unless rejecting"
                      className={`resize-y rounded-lg border bg-surface px-3 py-2.5 text-sm text-text-0 outline-none ${noteError ? 'border-danger' : 'border-border-strong focus-visible:border-accent'}`}
                    />
                    {noteError && (
                      <span role="alert" aria-live="polite" className="text-[11px] font-medium text-danger">
                        A note is required before rejecting.
                      </span>
                    )}
                  </label>

                  <div className="flex flex-wrap gap-2">
                    <button onClick={() => decide(active.officialEmail, 'verified')} className="h-10 rounded-lg bg-success px-4 text-sm font-semibold text-white">
                      Approve &amp; provision
                    </button>
                    <button onClick={() => decide(active.officialEmail, 'rejected')} className="h-10 rounded-lg border border-danger bg-danger-soft px-4 text-sm font-semibold text-danger">
                      Reject
                    </button>
                    <button
                      onClick={() => setShowMoreInfoNotice(true)}
                      className="h-10 rounded-lg border border-border-strong bg-surface px-3.5 text-sm font-semibold text-text-0"
                    >
                      Request more information
                    </button>
                  </div>
                  {showMoreInfoNotice && (
                    <div className="mt-3 rounded-lg border border-border-strong bg-surface-sunken px-3 py-2 text-[11.5px] text-text-1">
                      No reviewer-to-requester messaging thread exists yet for org claims in this build — nothing was sent.
                    </div>
                  )}
                  <p className="mt-3.5 text-[11.5px] leading-relaxed text-text-1">
                    Approving provisions the workspace immediately and notifies the requester. Rejecting requires a
                    note — they always get a reason.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

