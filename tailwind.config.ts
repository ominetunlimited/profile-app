import type { Config } from 'tailwindcss'

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        surface: 'var(--surface)',
        'surface-sunken': 'var(--surface-sunken)',
        'surface-secondary': 'var(--surface-secondary)',
        border: {
          DEFAULT: 'var(--border)',
          strong: 'var(--border-strong)',
        },
        text: {
          0: 'var(--text-0)',
          1: 'var(--text-1)',
          2: 'var(--text-2)',
        },
        accent: 'var(--accent)',
        // Accessibility spot-check gap #2 — dark mode's --accent is a
        // lighter blue tuned for text/link legibility against a dark page
        // background; that same value only reaches ~3.2:1 for white text
        // on a solid button fill, short of WCAG AA. A fixed, theme-
        // invariant shade for solid-fill + white-text contexts specifically.
        'accent-solid': 'var(--accent-solid)',
        'accent-hover': 'var(--accent-hover)',
        link: 'var(--link)',
        trust: 'var(--trust)',
        gold: 'var(--gold)',
        success: 'var(--success)',
        warning: 'var(--warning)',
        danger: 'var(--danger)',
        coral: 'var(--coral)',
        'coral-soft': 'var(--coral-soft)',
        // Design handoff gap audit: mockups style callouts/pills as a soft
        // filled tint (e.g. `background:var(--warning-soft)`) — this token
        // family didn't exist anywhere in the app, so real components fell
        // back to plain bordered/neutral treatments instead.
        'accent-soft': 'var(--accent-soft)',
        'trust-soft': 'var(--trust-soft)',
        'gold-soft': 'var(--gold-soft)',
        'success-soft': 'var(--success-soft)',
        'warning-soft': 'var(--warning-soft)',
        'danger-soft': 'var(--danger-soft)',
        // §1 official palette + §20 geometric token — exposed so new PROFILE
        // components (seals, motifs, backgrounds) can reference the raw brand
        // colours and the geometric system colour directly via Tailwind too.
        'profile-royal': 'var(--profile-royal)',
        'profile-beige': 'var(--profile-beige)',
        'profile-powder': 'var(--profile-powder)',
        'profile-blue': 'var(--profile-blue)',
        'profile-bright-blue': 'var(--profile-bright-blue)',
        'profile-gold': 'var(--profile-gold)',
        'profile-off-white': 'var(--profile-off-white)',
        'profile-green': 'var(--profile-green)',
        'profile-geometric': 'var(--profile-geometric)',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        // Design handoff gap audit (6/6 screen groups flagged this): every
        // mockup's h1/h2 spec 'Plus Jakarta Sans' 700/800 — never loaded or
        // applied anywhere in the real app before this. `font-heading` is
        // additionally applied as a global h1-h3 rule in tokens.css so no
        // per-screen className sweep was needed.
        heading: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
} satisfies Config
