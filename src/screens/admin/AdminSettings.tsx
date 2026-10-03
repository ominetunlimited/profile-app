import { useEffect, useState } from 'react'
import { Button } from '@/shared/ui/Button'
import { useAdmin } from '@/app/AdminContext'
import { platformRoleCan } from '@/app/platformAdminStore'
import {
  ALERT_EVENTS,
  CONTACT_FIELDS,
  fetchPlatformSettings,
  getNotificationSettings,
  savePlatformSettings,
  setTelegram,
  testTelegram,
  type NotificationSettings,
  type PlatformSettings,
} from '@/app/platformSettings'

/** Support contact details (shown publicly in the Help Centre) and Telegram alerts for staff. */
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

  useEffect(() => {
    if (!allowed) return
    let live = true
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

  const inputCls = 'min-h-[40px] w-full rounded-lg border border-border-strong bg-surface px-3 text-sm text-text-0 outline-none focus-visible:border-accent'

  return (
    <div className="max-w-[760px]">
      <h1 className="mb-1 text-2xl font-bold tracking-tight text-text-0">Support &amp; notifications</h1>
      <p className="mb-6 text-sm text-text-1">Where people can reach you, and how your team hears about things that need a decision.</p>

      <section className="mb-6 rounded-xl border border-border bg-surface p-5" aria-labelledby="contact-h">
        <h2 id="contact-h" className="mb-1 text-[15px] font-semibold text-text-0">Support contact details</h2>
        <p className="mb-4 text-xs text-text-1">Shown to everyone on the Help Centre. Leave a field empty to hide it.</p>
        {!settings ? (
          <p className="text-sm text-text-1">Loading…</p>
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
          <p className="text-sm text-text-1">Loading…</p>
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
