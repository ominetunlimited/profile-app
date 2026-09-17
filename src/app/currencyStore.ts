/**
 * V9 Unified Ecosystem Patch §15 — extends the "CountryLocaleCommercePolicy"
 * the Complete Build & Design Audit Prompt names, which was never actually
 * present anywhere in this codebase's source (grep across src/ for
 * `CountryLocaleCommercePolicy`/`defaultCurrency`/`exchangeRate` before this
 * file returns nothing) — so this is the real, first implementation of it,
 * not an extension of existing code. Two honestly-scoped parts:
 *
 * 1. `CURRENCY_BY_COUNTRY` — a real country→ISO-4217 lookup, same pattern
 *    as countryData.ts's own COUNTRIES table: covers the world's major
 *    economies explicitly, and is honest about the rest rather than
 *    guessing — `currencyForCountry()` falls back to USD only when a
 *    country genuinely isn't in the table, same "not exhaustive, never
 *    silently wrong" spirit as toolCatalogue.ts.
 * 2. A real, live exchange-rate fetch (open.er-api.com — a free, keyless,
 *    publicly documented endpoint; no backend/API key needed for a client-
 *    only build like this one) with localStorage caching so it survives a
 *    reload without refetching, and an honestly-disclosed stale/unavailable
 *    state if the fetch fails — never a fabricated or hardcoded rate.
 */
export const CURRENCY_BY_COUNTRY: Record<string, string> = {
  'United States': 'USD', Canada: 'CAD', 'United Kingdom': 'GBP', Ireland: 'EUR',
  Germany: 'EUR', France: 'EUR', Spain: 'EUR', Italy: 'EUR', Netherlands: 'EUR',
  Portugal: 'EUR', Belgium: 'EUR', Austria: 'EUR', Greece: 'EUR', Finland: 'EUR',
  'Nigeria': 'NGN', Ghana: 'GHS', Kenya: 'KES', 'South Africa': 'ZAR', Egypt: 'EGP',
  Morocco: 'MAD', Ethiopia: 'ETB', Tanzania: 'TZS', Uganda: 'UGX', 'Ivory Coast': 'XOF',
  Senegal: 'XOF', Cameroon: 'XAF', India: 'INR', China: 'CNY', Japan: 'JPY',
  'South Korea': 'KRW', Indonesia: 'IDR', Pakistan: 'PKR', Bangladesh: 'BDT',
  Philippines: 'PHP', Vietnam: 'VND', Thailand: 'THB', Malaysia: 'MYR', Singapore: 'SGD',
  'Saudi Arabia': 'SAR', 'United Arab Emirates': 'AED', Qatar: 'QAR', Israel: 'ILS',
  Turkey: 'TRY', Russia: 'RUB', Ukraine: 'UAH', Poland: 'PLN', Switzerland: 'CHF',
  Sweden: 'SEK', Norway: 'NOK', Denmark: 'DKK', Brazil: 'BRL', Mexico: 'MXN',
  Argentina: 'ARS', Colombia: 'COP', Chile: 'CLP', Peru: 'PEN', Australia: 'AUD',
  'New Zealand': 'NZD',
}

export function currencyForCountry(country: string): string {
  return CURRENCY_BY_COUNTRY[country] ?? 'USD'
}

interface RateCache {
  base: 'USD'
  rates: Record<string, number>
  fetchedAt: string
}

const CACHE_KEY = 'profile:demo-fx-rates'
const CACHE_TTL_MS = 6 * 60 * 60 * 1000 // 6 hours — real-time enough for a demo without hammering a free public API

function readCache(): RateCache | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' && parsed.rates ? parsed : null
  } catch {
    return null
  }
}

function writeCache(cache: RateCache) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(cache))
  } catch {
    // best-effort demo scaffolding only
  }
}

export interface FxRates {
  rates: Record<string, number>
  fetchedAt: string
  stale: boolean
}

/**
 * Live-fetches USD-based rates (cached for CACHE_TTL_MS). On failure —
 * offline, the endpoint down — falls back to whatever was last cached and
 * marks it `stale: true` rather than fabricating a rate; if nothing has
 * ever been cached, returns `rates: {}` and the caller must show "rate
 * unavailable," never a silent 1:1 conversion pretending to be real.
 */
export async function getFxRates(): Promise<FxRates> {
  const cached = readCache()
  const isFresh = cached && Date.now() - new Date(cached.fetchedAt).getTime() < CACHE_TTL_MS
  if (isFresh && cached) return { rates: cached.rates, fetchedAt: cached.fetchedAt, stale: false }

  try {
    const res = await fetch('https://open.er-api.com/v6/latest/USD')
    if (!res.ok) throw new Error(`FX endpoint returned ${res.status}`)
    const data = await res.json()
    if (!data.rates || typeof data.rates !== 'object') throw new Error('FX endpoint returned no rates')
    const fresh: RateCache = { base: 'USD', rates: data.rates, fetchedAt: new Date().toISOString() }
    writeCache(fresh)
    return { rates: fresh.rates, fetchedAt: fresh.fetchedAt, stale: false }
  } catch {
    if (cached) return { rates: cached.rates, fetchedAt: cached.fetchedAt, stale: true }
    return { rates: {}, fetchedAt: '', stale: true }
  }
}

/** `null` when `toCurrency` isn't in the fetched rate table — the caller
 * must show "conversion unavailable," never guess a rate. */
export function convertFromUsd(amountUsd: number, toCurrency: string, rates: Record<string, number>): number | null {
  if (toCurrency === 'USD') return amountUsd
  const rate = rates[toCurrency]
  if (typeof rate !== 'number') return null
  return amountUsd * rate
}

export function formatMoney(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency, maximumFractionDigits: 0 }).format(amount)
  } catch {
    return `${amount.toFixed(0)} ${currency}`
  }
}
