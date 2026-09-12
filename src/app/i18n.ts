/**
 * §30 Globalisation & Multilingual Architecture. §30.2's Phase 1 Languages,
 * verbatim — corrected from the 7-language list built into Settings in
 * Phase 2, which came from §25's own `phase1Languages` field before §30 (the
 * dedicated globalisation section) was read. §25 and §30 disagree
 * (§25 omits Hindi/Russian/Japanese); §30 is adopted as authoritative since
 * it's the section this whole architecture is named for, not a settings-tab
 * side mention. Flagged, not silently merged.
 */
export const LANGUAGES = [
  { code: 'en', label: 'English', native: 'English' },
  { code: 'fr', label: 'French', native: 'Français' },
  { code: 'zh', label: 'Mandarin Chinese', native: '中文' },
  { code: 'ar', label: 'Arabic', native: 'العربية' },
  { code: 'de', label: 'German', native: 'Deutsch' },
  { code: 'es', label: 'Spanish', native: 'Español' },
  { code: 'pt', label: 'Portuguese', native: 'Português' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ru', label: 'Russian', native: 'Русский' },
  { code: 'ja', label: 'Japanese', native: '日本語' },
] as const

export type LanguageCode = (typeof LANGUAGES)[number]['code']

/**
 * §30.4 RTL Support lists Arabic, Hebrew, Farsi, Urdu — only Arabic is in
 * the Phase 1 selectable list above; Hebrew/Farsi/Urdu are §30.3 Phase 2
 * languages not yet addable, so RTL is demonstrated with the one Phase 1
 * language that needs it. The `dir`-attribute mechanism below works
 * identically for the other three once they're added — no rewrite needed.
 */
const RTL_LANGUAGES: LanguageCode[] = ['ar']

export function isRtl(lang: LanguageCode): boolean {
  return RTL_LANGUAGES.includes(lang)
}

export function fontStackFor(lang: LanguageCode): string {
  return lang === 'ar' ? "'Noto Sans Arabic', Inter, sans-serif" : 'Inter, system-ui, sans-serif'
}

/**
 * A representative, real translation set — not all ~50 screens (that's a
 * mechanical scaling task once this infrastructure exists, flagged as a
 * follow-up rather than claimed complete). Covers the highest-visibility
 * surfaces: primary nav, the Public Hero, and the Home mini-widget the
 * Handoff's own "i18n & RTL Example" screen demonstrates in exactly these
 * three languages (English/German/Arabic) plus nav-level coverage across
 * all 10 Phase 1 languages.
 */
export const TRANSLATIONS: Record<string, Partial<Record<LanguageCode, string>>> = {
  'nav.home': { en: 'Home', fr: 'Accueil', zh: '首页', ar: 'الرئيسية', de: 'Startseite', es: 'Inicio', pt: 'Início', hi: 'होम', ru: 'Главная', ja: 'ホーム' },
  'nav.about': { en: 'About', fr: 'À propos', zh: '关于', ar: 'حول', de: 'Über uns', es: 'Acerca de', pt: 'Sobre', hi: 'हमारे बारे में', ru: 'О нас', ja: '概要' },
  'nav.trust': { en: 'Trust', fr: 'Confiance', zh: '信任', ar: 'الثقة', de: 'Vertrauen', es: 'Confianza', pt: 'Confiança', hi: 'विश्वास', ru: 'Доверие', ja: '信頼' },
  'nav.opportunities': { en: 'Opportunities', fr: 'Opportunités', zh: '机会', ar: 'الفرص', de: 'Chancen', es: 'Oportunidades', pt: 'Oportunidades', hi: 'अवसर', ru: 'Возможности', ja: '機会' },
  'nav.career': { en: 'Career', fr: 'Carrière', zh: '职业', ar: 'المسار المهني', de: 'Karriere', es: 'Carrera', pt: 'Carreira', hi: 'करियर', ru: 'Карьера', ja: 'キャリア' },
  'nav.blog': { en: 'Blog', fr: 'Blog', zh: '博客', ar: 'المدونة', de: 'Blog', es: 'Blog', pt: 'Blog', hi: 'ब्लॉग', ru: 'Блог', ja: 'ブログ' },
  'nav.help': { en: 'Help', fr: 'Aide', zh: '帮助', ar: 'المساعدة', de: 'Hilfe', es: 'Ayuda', pt: 'Ajuda', hi: 'सहायता', ru: 'Помощь', ja: 'ヘルプ' },
  'nav.signin': { en: 'Sign In', fr: 'Se connecter', zh: '登录', ar: 'تسجيل الدخول', de: 'Anmelden', es: 'Iniciar sesión', pt: 'Entrar', hi: 'साइन इन करें', ru: 'Войти', ja: 'サインイン' },
  'nav.openProfile': { en: 'Open Your PROFILE', fr: 'Ouvrez votre PROFILE', zh: '开启您的 PROFILE', ar: 'افتح ملفك في PROFILE', de: 'Eröffnen Sie Ihr PROFILE', es: 'Abra su PROFILE', pt: 'Abra o seu PROFILE', hi: 'अपना PROFILE खोलें', ru: 'Откройте свой PROFILE', ja: 'PROFILEを開設' },

  'hero.tag': { en: 'Built on Proof', de: 'Auf Beweisen aufgebaut', ar: 'مبني على الإثبات' },
  'hero.headline': { en: 'Where work becomes credibility.', de: 'Wo Arbeit zu Glaubwürdigkeit wird.', ar: 'حيث يتحول العمل إلى مصداقية.' },
  'hero.subhead': {
    en: 'Build your professional identity, turn your work into evidence, verify what matters, and let trust — not attention — open the next opportunity.',
    de: 'Baue deine berufliche Identität auf, verwandle deine Arbeit in Nachweise, verifiziere, was zählt, und lass Vertrauen — nicht Aufmerksamkeit — die nächste Chance eröffnen.',
    ar: 'ابنِ هويتك المهنية، وحوّل عملك إلى دليل، وتحقق مما يهم، ودع الثقة — لا الاهتمام — تفتح الفرصة التالية.',
  },
  'hero.cta.primary': { en: 'Open Your PROFILE', de: 'Eröffnen Sie Ihr PROFILE', ar: 'افتح ملفك في PROFILE' },
  'hero.cta.secondary': { en: 'See how it works', de: 'So funktioniert es', ar: 'شاهد كيف يعمل' },

  'settings.language': { en: 'Language & Region', fr: 'Langue et région', zh: '语言与地区', ar: 'اللغة والمنطقة', de: 'Sprache & Region', es: 'Idioma y región', pt: 'Idioma e região', hi: 'भाषा और क्षेत्र', ru: 'Язык и регион', ja: '言語と地域' },
}

export function translate(lang: LanguageCode, key: string): string {
  return TRANSLATIONS[key]?.[lang] ?? TRANSLATIONS[key]?.en ?? key
}
