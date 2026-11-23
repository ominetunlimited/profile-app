import { ProfileLogoAnimated } from '@/shared/ui/ProfileLogoAnimated'
import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'
import {
  ALERT_EVENTS,
  CONTACT_FIELDS,
  fetchPlatformSettings,
  getEmailLog,
  getEmailSettings,
  getNotificationSettings,
  savePlatformSettings,
  setEmail,
  setTelegram,
  testEmail,
  testTelegram,
  type EmailLogEntry,
  type EmailSettings,
  type NotificationSettings,
  type PlatformSettings,
} from '@/app/platformSettings'

/** Support contact details (shown publicly in the Help Centre), email delivery and Telegram alerts for staff. */
export function AdminSettings() {
  const { admin } = useAdmin()
  const allowed = !!admin && platformRoleCan(admin.role, 'platform_settings')
  const isSuper = admin?.role === 'super_administrator'

  const [settings, setSettings] = useState<PlatformSettings | null>(null)
  const [contact, setContact] = useState<Record<string, string>>({})
  const [contactMsg, setContactMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingContact, setSavingContact] = useState(false)

  const [notif, setNotif] = useState<NotificationSettings | null>(null)
  const [token, setToken] = useState('')
  const [chatId, setChatId] = useState('')
  const [enabled, setEnabled] = useState(false)
  const [events, setEvents] = useState<string[]>([])
  const [tgMsg, setTgMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [savingTg, setSavingTg] = useState(false)
  const [testing, setTesting] = useState(false)

  const [mail, setMail] = useState<EmailSettings | null>(null)
  const [mailKey, setMailKey] = useState('')
  const [mailFrom, setMailFrom] = useState('')
  const [mailName, setMailName] = useState('PROFILE')
  const [mailReply, setMailReply] = useState('')
  const [mailOn, setMailOn] = useState(false)
  const [mailTo, setMailTo] = useState('')
  const [mailMsg, setMailMsg] = useState<{ ok: boolean; text: string } | null>(null)
  const [mailLog, setMailLog] = useState<EmailLogEntry[]>([])
  const [savingMail, setSavingMail] = useState(false)
  const [testingMail, setTestingMail] = useState(false)

  useEffect(() => {
    if (!allowed) return
    let live = true
    getEmailSettings()
      .then((m) => {
        if (!live) return
        setMail(m)
        setMailFrom(m.from_address ?? '')
        setMailName(m.from_name)
        setMailReply(m.reply_to ?? '')
        setMailOn(m.enabled)
      })
      .catch((e: Error) => live && setMailMsg({ ok: false, text: e.message }))
    getEmailLog().then((l) => live && setMailLog(l)).catch(() => undefined)
    void fetchPlatformSettings().then((s) => {
      if (!live || !s) return
      setSettings(s)
      setContact(Object.fromEntries(CONTACT_FIELDS.map((f) => [f.key, (s[f.key] as string | null) ?? ''])))
    })
    getNotificationSettings()
      .then((n) => {
        if (!live) return
        setNotif(n)
        setChatId(n.telegram_chat_id ?? '')
        setEnabled(n.telegram_enabled)
        setEvents(n.events)
      })
      .catch((e: Error) => live && setTgMsg({ ok: false, text: e.message }))
    return () => {
      live = false
    }
  }, [allowed])

  if (!allowed) return <p className="rounded-xl border border-border bg-surface p-5 text-sm text-text-1">Your role doesn't include platform settings.</p>

  async function saveContact() {
    setSavingContact(true)
    setContactMsg(null)
    try {
      await savePlatformSettings(contact)
      setContactMsg({ ok: true, text: 'Saved. These now show in the Help Centre.' })
    } catch (e) {
      setContactMsg({ ok: false, text: (e as Error).message })
    }
    setSavingContact(false)
  }

  async function saveTelegram() {
    setSavingTg(true)
    setTgMsg(null)
    try {
      await setTelegram({ token: token || undefined, chatId, enabled, events })
      setToken('')
      setNotif(await getNotificationSettings())
      setTgMsg({ ok: true, text: 'Saved.' })
    } catch (e) {
      setTgMsg({ ok: false, text: (e as Error).message })
    }
    setSavingTg(false)
  }

  async function sendTest() {
    setTesting(true)
    setTgMsg(null)
    try {
      const r = await testTelegram()
      setTgMsg({ ok: r.ok, text: r.message })
    } catch (e) {
      setTgMsg({ ok: false, text: (e as Error).message })
    }
    setTesting(false)
  }

  async function saveMail() {
    setSavingMail(true)
    setMailMsg(null)
    try {
      await setEmail({ key: mailKey || undefined, fromAddress: mailFrom, fromName: mailName, replyTo: mailReply, enabled: mailOn })
      setMailKey('')
      setMail(await getEmailSettings())
      setMailMsg({ ok: true, text: 'Saved.' })
    } catch (e) {
      setMailMsg({ ok: false, text: (e as Error).message })
    }
    setSavingMail(false)
  }

  async function sendMailTest() {
    setTestingMail(true)
    setMailMsg(null)
    try {
      const r = await testEmail(mailTo.trim())
      setMailMsg({ ok: r.ok, text: r.message })
      setMailLog(await getEmailLog())
    } catch (e) {
      setMailMsg({ ok: false, text: (e as Error).message })
    }
    setTestingMail(false)
  }

  const inputCls = 'min-h-[40px] w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent'

  return (
    <div className="max-w-[760px]">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Support &amp; notifications</h1>
      <p className="mb-6 text-sm text-text-1">Where people can reach you, and how your team hears about things that need a decision.</p>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5" aria-labelledby="contact-h">
        <h2 id="contact-h" className="mb-1 text-[15px] font-semibold text-text-0">Support contact details</h2>
        <p className="mb-4 text-xs text-text-1">Shown to everyone on the Help Centre. Leave a field empty to hide it.</p>
        {!settings ? (
          <div className="flex justify-center py-6"><ProfileLogoAnimated state="loading" size={32} /></div>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {CONTACT_FIELDS.map((f) => (
              <label key={f.key} className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-0">{f.label}</span>
                <input type={f.type} value={contact[f.key] ?? ''} onChange={(e) => setContact((c) => ({ ...c, [f.key]: e.target.value }))} placeholder={f.placeholder} className={inputCls} />
              </label>
            ))}
          </div>
        )}
        <div className="mt-4 flex flex-wrap items-center gap-3">
          <Button disabled={savingContact || !settings} onClick={() => void saveContact()}>
            {savingContact ? 'Saving…' : 'Save contact details'}
          </Button>
          {contactMsg && (
            <span role={contactMsg.ok ? 'status' : 'alert'} className={`text-xs ${contactMsg.ok ? 'text-success' : 'text-danger'}`}>
              {contactMsg.text}
            </span>
          )}
        </div>
      </section>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5" aria-labelledby="mail-h">
        <h2 id="mail-h" className="mb-1 text-[15px] font-semibold text-text-0">Email delivery</h2>
        <p className="mb-3 text-xs leading-relaxed text-text-1">
          Lets PROFILE email people, starting with organisation staff invitations (people without an account get a sign-up link). Emails are short fixed text. Delivery uses Resend, so you need a Resend account, an API key, and a sending domain verified there.
        </p>
        <ol className="mb-4 list-decimal space-y-0.5 ps-5 text-xs text-text-1">
          <li>Create an account at resend.com and add and verify your sending domain.</li>
          <li>Create an API key with sending access and paste it below.</li>
          <li>Enter a from-address on that domain, switch delivery on, save, then send yourself a test email.</li>
        </ol>
        {!isSuper && <p className="mb-3 rounded-lg border border-warning bg-warning-soft p-3 text-xs text-text-0">Only a super administrator can change email delivery. You can see its status here.</p>}
        {!mail ? (
          <div className="flex justify-center py-6"><ProfileLogoAnimated state="loading" size={32} /></div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-0">API key</span>
              <input type="password" autoComplete="off" value={mailKey} onChange={(e) => setMailKey(e.target.value)} disabled={!isSuper} placeholder={mail.key_set ? 'A key is saved — paste a new one to replace it' : 're_…'} className={inputCls} />
              <span className="text-[11px] text-text-2">Stored encrypted. It can't be read back from this page once saved.</span>
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-0">From address</span>
                <input type="email" value={mailFrom} onChange={(e) => setMailFrom(e.target.value)} disabled={!isSuper} placeholder="no-reply@yourdomain.com" className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5">
                <span className="text-xs font-medium text-text-0">From name</span>
                <input value={mailName} onChange={(e) => setMailName(e.target.value)} disabled={!isSuper} className={inputCls} />
              </label>
              <label className="flex flex-col gap-1.5 sm:col-span-2">
                <span className="text-xs font-medium text-text-0">Reply-to (optional)</span>
                <input type="email" value={mailReply} onChange={(e) => setMailReply(e.target.value)} disabled={!isSuper} placeholder="support@yourdomain.com" className={inputCls} />
              </label>
            </div>
            <label className="flex items-center gap-2.5 text-sm text-text-0">
              <input type="checkbox" checked={mailOn} onChange={(e) => setMailOn(e.target.checked)} disabled={!isSuper} />
              Send emails
            </label>
            {isSuper && (
              <div className="flex flex-wrap items-end gap-3">
                <Button disabled={savingMail} onClick={() => void saveMail()}>
                  {savingMail ? 'Saving…' : 'Save email settings'}
                </Button>
                <input type="email" value={mailTo} onChange={(e) => setMailTo(e.target.value)} placeholder="Send a test to…" aria-label="Test email recipient" className={`${inputCls} max-w-[240px]`} />
                <Button variant="secondary" disabled={testingMail || !mail.key_set || !mailTo.trim()} onClick={() => void sendMailTest()}>
                  {testingMail ? 'Sending…' : 'Send test email'}
                </Button>
              </div>
            )}
            {mailMsg && (
              <p role={mailMsg.ok ? 'status' : 'alert'} className={`text-xs ${mailMsg.ok ? 'text-success' : 'text-danger'}`}>
                {mailMsg.text}
              </p>
            )}
            {mailLog.length > 0 && (
              <div className="overflow-x-auto rounded-lg border border-border">
                <table className="w-full text-left text-xs">
                  <thead className="bg-surface-sunken text-text-2">
                    <tr>
                      <th className="px-3 py-2 font-medium">When</th>
                      <th className="px-3 py-2 font-medium">To</th>
                      <th className="px-3 py-2 font-medium">What</th>
                      <th className="px-3 py-2 font-medium">Provider</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mailLog.map((l, i) => (
                      <tr key={i} className="border-t border-border text-text-1">
                        <td className="px-3 py-2">{new Date(l.at).toLocaleString()}</td>
                        <td className="px-3 py-2">{l.to}</td>
                        <td className="px-3 py-2">{l.kind === 'org_staff_invite' ? 'Staff invitation' : l.kind === 'test' ? 'Test' : l.kind}</td>
                        <td className="px-3 py-2">{l.status == null ? 'Pending' : l.status >= 200 && l.status < 300 ? 'Accepted' : `Refused (${l.status})`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-border bg-surface p-5" aria-labelledby="tg-h">
        <h2 id="tg-h" className="mb-1 text-[15px] font-semibold text-text-0">Telegram alerts</h2>
        <p className="mb-3 text-xs leading-relaxed text-text-1">
          Get a Telegram message when something needs your team. Messages are short fixed text with a link into the Admin Centre — they never include anyone's personal details.
        </p>
        <ol className="mb-4 list-decimal space-y-0.5 ps-5 text-xs text-text-1">
          <li>In Telegram, message <span className="font-mono">@BotFather</span>, send <span className="font-mono">/newbot</span>, and copy the bot token it gives you.</li>
          <li>Start a chat with your new bot (or add it to a group) and send it any message.</li>
          <li>Open <span className="font-mono">https://api.telegram.org/bot&lt;your token&gt;/getUpdates</span> in a browser and copy the number after <span className="font-mono">"chat":{'{'}"id":</span>.</li>
          <li>Paste both below, switch alerts on, save, and press Send test message.</li>
        </ol>
        {!isSuper && <p className="mb-3 rounded-lg border border-warning bg-warning-soft p-3 text-xs text-text-0">Only a super administrator can change Telegram delivery. You can see its status here.</p>}
        {!notif ? (
          <div className="flex justify-center py-6"><ProfileLogoAnimated state="loading" size={32} /></div>
        ) : (
          <div className="flex flex-col gap-3.5">
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-0">Bot token</span>
              <input type="password" autoComplete="off" value={token} onChange={(e) => setToken(e.target.value)} disabled={!isSuper} placeholder={notif.token_set ? 'A token is saved — paste a new one to replace it' : '123456:ABC-DEF…'} className={inputCls} />
              <span className="text-[11px] text-text-2">Stored encrypted. It can't be read back from this page once saved.</span>
            </label>
            <label className="flex flex-col gap-1.5">
              <span className="text-xs font-medium text-text-0">Chat id</span>
              <input value={chatId} onChange={(e) => setChatId(e.target.value)} disabled={!isSuper} placeholder="e.g. 123456789 or -1001234567890" className={inputCls} />
            </label>
            <label className="flex items-center gap-2.5 text-sm text-text-0">
              <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} disabled={!isSuper} />
              Send Telegram alerts
            </label>
            <fieldset className="rounded-lg border border-border p-3">
              <legend className="px-1 text-xs font-medium text-text-0">Alert me about</legend>
              <div className="grid grid-cols-1 gap-1.5 sm:grid-cols-2">
                {ALERT_EVENTS.map((ev) => (
                  <label key={ev.key} className="flex items-center gap-2 text-xs text-text-1">
                    <input
                      type="checkbox"
                      checked={events.includes(ev.key)}
                      disabled={!isSuper}
                      onChange={(e) => setEvents((cur) => (e.target.checked ? [...cur, ev.key] : cur.filter((x) => x !== ev.key)))}
                    />
                    {ev.label}
                  </label>
                ))}
              </div>
            </fieldset>
            {isSuper && (
              <div className="flex flex-wrap items-center gap-3">
                <Button disabled={savingTg} onClick={() => void saveTelegram()}>
                  {savingTg ? 'Saving…' : 'Save Telegram settings'}
                </Button>
                <Button variant="secondary" disabled={testing || !notif.token_set} onClick={() => void sendTest()}>
                  {testing ? 'Sending…' : 'Send test message'}
                </Button>
              </div>
            )}
            {tgMsg && (
              <p role={tgMsg.ok ? 'status' : 'alert'} className={`text-xs ${tgMsg.ok ? 'text-success' : 'text-danger'}`}>
                {tgMsg.text}
              </p>
            )}
          </div>
        )}
      </section>
    </div>
  )
}
