// Brand rule: in-app UI uses transparent logo artwork. Logos with a background
// (app icon, favicon, symbol light/dark) are only for icons, favicons and social images.
import { readdirSync, readFileSync, statSync } from 'node:fs'
import { join } from 'node:path'
const banned = [/symbol\.(light|dark)\b/, /BRAND\.appIcon/, /profile-app-icon/, /profile-favicon\.svg/, /profile-symbol-(light|dark)\.svg/]
const bad = []
const walk = (d) => { for (const n of readdirSync(d)) { const p = join(d, n); statSync(p).isDirectory() ? walk(p) : /\.(tsx?|css)$/.test(n) && !p.endsWith('shared/brand/assets.ts') && banned.some((r) => r.test(readFileSync(p, 'utf8'))) && bad.push(p) } }
walk('src')
if (bad.length) { console.error('Backgrounded logo used in UI:\n' + bad.join('\n')); process.exit(1) }
console.log('Logo usage OK')
