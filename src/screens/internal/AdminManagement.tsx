import { useState } from 'react'
import { Field, TextInput } from '@/shared/ui/Field'
import { InternalNav } from './InternalNav'
import {
  addScopedAdmin,
  listScopedAdmins,
  revokeScopedAdmin,
  INTERNAL_SCOPES,
  type InternalScope,
} from '@/app/internalStaffStore'

/**
 * Patch (pre-Phase-7) B9: Owner-only screen to invite/scope/revoke Admins.
 * "Invite" has no email delivery yet (no backend) — adding an Admin here
 * records a real ScopedAdmin entry immediately rather than pretending to
 * send mail it can't send.
 */
export function AdminManagement() {
  const [admins, setAdmins] = useState(() => listScopedAdmins())
  const [email, setEmail] = useState('')
  const [label, setLabel] = useState('')
  const [scopes, setScopes] = useState<InternalScope[]>([])

  function toggleScope(s: InternalScope) {
    setScopes((prev) => (prev.includes(s) ? prev.filter((x) => x !== s) : [...prev, s]))
  }

  function addAdmin() {
    if (!email.trim() || !label.trim() || scopes.length === 0) return
    addScopedAdmin({ email: email.trim(), label: label.trim(), scopes, createdBy: 'owner' })
    setEmail('')
    setLabel('')
    setScopes([])
    setAdmins(listScopedAdmins())
  }

  return (
    <div className="min-h-screen bg-bg text-text-0">
      <a href="#main" className="skip-link">
        Skip to main content
      </a>
      <InternalNav />
      <header className="border-b border-border bg-surface px-6 py-4">
        <div className="font-mono text-[11px] uppercase tracking-widest text-text-2">Internal · Owner</div>
        <h1 className="text-lg font-semibold">Admin Management</h1>
        <p className="max-w-[74ch] text-sm text-text-1">
          Create scoped Admins with access to specific internal tools. Owner-only.
        </p>
      </header>

      <main id="main" className="mx-auto grid max-w-4xl gap-8 px-6 py-8 lg:grid-cols-[1fr_1.2fr]">
        <section className="flex flex-col gap-4 rounded-xl border border-border bg-surface p-5">
          <h2 className="font-semibold text-text-0">Add Admin</h2>
          <Field label="Name">
            <TextInput value={label} onChange={(e) => setLabel(e.target.value)} placeholder="Admin's name" />
          </Field>
          <Field label="Email">
            <TextInput type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="admin@example.com" />
          </Field>
          <Field label="Scopes" hint="Which internal tools this Admin can access">
            <div className="flex flex-col gap-2">
              {INTERNAL_SCOPES.map((s) => (
                <label key={s.value} className="flex items-center gap-2 text-sm text-text-0">
                  <input type="checkbox" checked={scopes.includes(s.value)} onChange={() => toggleScope(s.value)} />
                  {s.label}
                </label>
              ))}
            </div>
          </Field>
          <button
            onClick={addAdmin}
            disabled={!email.trim() || !label.trim() || scopes.length === 0}
            className="mt-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-40"
          >
            Add Admin
          </button>
        </section>

        <section>
          <h2 className="mb-3 font-semibold text-text-0">Current Admins</h2>
          {admins.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border-strong bg-surface-sunken p-10 text-center text-sm text-text-1">
              No scoped Admins yet — every internal tool is Owner/generic-staff only until one is added here.
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {admins.map((a) => (
                <div key={a.id} className="rounded-lg border border-border bg-surface p-4">
                  <div className="mb-1 flex items-center justify-between gap-2">
                    <p className="font-semibold text-text-0">{a.label}</p>
                    <button onClick={() => { revokeScopedAdmin(a.id); setAdmins(listScopedAdmins()) }} className="text-xs font-semibold text-danger">
                      Revoke
                    </button>
                  </div>
                  <p className="mb-2 text-xs text-text-1">{a.email}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {a.scopes.map((s) => (
                      <span key={s} className="rounded-full border border-border px-2 py-0.5 text-[10.5px] uppercase text-text-2">
                        {s.replace('_', ' ')}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  )
}
