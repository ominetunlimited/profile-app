# PROFILE — Logo Animation Integration Prompt
### For Claude, Cursor, Bolt, Lovable, v0, or any AI coding assistant

---

## CONTEXT

You are working inside the **PROFILE** project — a React single-file MVP (`profile-mvp.jsx`) that uses inline styles, no external CSS files, no Tailwind, no animation libraries, and no build-time dependencies beyond React itself.

The project already has:
- A **theme object** `T` with all colour tokens (`T.bg`, `T.cyan`, `T.blueD`, etc.)
- A **style object** `S` with layout styles including `S.sLogoDot` (the current dot logo mark)
- Shared helpers: `Av`, `Btn`, `Badge`, `Card`, `Input`, `Select`, `Toggle`, `Toast`
- An `AuthScreen` component with sign-in and a 6-step registration flow
- A root `App` component with sidebar nav, topbar, and page router
- Pages: `HomePage`, `CVPage`, `ConnectionsPage`, `DiscoverPage`, `MessagesPage`, `NotificationsPage`, `StorePage`, `SettingsPage`

**Do not restructure, rename, or remove any of the above. Do not add external libraries. Do not add a build step. Do not change how routing, state, or props work.**

---

## WHAT YOU ARE ADDING

A single reusable React component called `ProfileLogo` that renders the official PROFILE animated SVG logo — a stylised **P letterform** with a glowing sphere head and **three Wi-Fi-style arc bars** ( ))) ) emanating right from the head — with 10 distinct animation states driven entirely by CSS `@keyframes`.

---

## STEP 1 — ADD THE PROFILELOGO COMPONENT

Place this component **immediately after the `Toast` helper and before the `FEED` data constant**. Do not place it inside any other component or function.

```jsx
// ─── PROFILE LOGO ANIMATION ──────────────────────────────────────────────────

// Inject keyframes once into <head>. Guarded by ID — safe to call on every render.
;(function injectProfileLogoStyles() {
  const ID = "pl-kf";
  if (typeof document === "undefined" || document.getElementById(ID)) return;
  const s = document.createElement("style");
  s.id = ID;
  s.textContent = `
    @keyframes pl-arc-wave {
      0%   { opacity:0; transform:scale(.52); }
      16%  { opacity:.95; }
      78%  { opacity:.85; transform:scale(1); }
      100% { opacity:0;   transform:scale(1.08); }
    }
    @keyframes pl-arc-grow {
      0%   { opacity:0; transform:scale(.42); }
      22%  { opacity:.9; }
      100% { opacity:0; transform:scale(1.02); }
    }
    @keyframes pl-glow-breathe { 0%,100%{opacity:.5}  50%{opacity:.9} }
    @keyframes pl-glow-dim     { 0%,100%{opacity:.35} 50%{opacity:.1} }
    @keyframes pl-glow-idle    { 0%,100%{opacity:.18} 50%{opacity:.32} }
    @keyframes pl-orbit-spin   { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
    @keyframes pl-process-spin { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
    @keyframes pl-scan-rotate  { from{transform:rotate(0deg)}  to{transform:rotate(360deg)} }
    @keyframes pl-shake {
      0%,100%{ transform:translateX(0) rotate(0); }
      12%{ transform:translateX(-7px) rotate(-1.2deg); }
      26%{ transform:translateX(7px)  rotate(1.2deg); }
      40%{ transform:translateX(-5px) rotate(-.8deg); }
      55%{ transform:translateX(5px)  rotate(.8deg); }
      72%{ transform:translateX(-2px); }
    }
    @keyframes pl-error-bg     { 0%,100%{opacity:0} 28%,72%{opacity:.65} }
    @keyframes pl-error-ring   { 0%,100%{opacity:0} 28%,72%{opacity:.85} }
    @keyframes pl-amber-flash  { 0%,100%{opacity:0} 22%,78%{opacity:1} }
    @keyframes pl-success-ring { 0%{opacity:0} 18%{opacity:.9} 100%{opacity:0} }
    @keyframes pl-check-draw   {
      0%  { stroke-dashoffset:25; opacity:0; }
      10% { opacity:1; }
      65% { stroke-dashoffset:0; opacity:1; }
      100%{ stroke-dashoffset:0; opacity:0; }
    }
    @media (prefers-reduced-motion:reduce) {
      [data-pl] * { animation:none !important; }
    }
  `;
  document.head.appendChild(s);
})();

/**
 * ProfileLogo — Official PROFILE animated SVG logo.
 *
 * Props:
 *   state  {string}  "loading" | "connecting" | "syncing" | "success" |
 *                    "offline" | "error" | "retry" | "searching" |
 *                    "processing" | "idle"          Default: "idle"
 *   size   {number}  pixel width (height scales proportionally)  Default: 40
 *   style  {object}  extra wrapper styles (optional)
 */
function ProfileLogo({ state = "idle", size = 40, style: wx = {} }) {
  const VW = 400, VH = 420;
  const HX = 202.36, HY = 150.21, HR = 37.98;
  const R1 = 55, R2 = 80, R3 = 108;
  const h = Math.round(size * VH / VW);

  const arc = (r, deg = 65) => {
    const a = deg * Math.PI / 180;
    const x1 = HX + r * Math.cos(-a), y1 = HY + r * Math.sin(-a);
    const x2 = HX + r * Math.cos(a),  y2 = HY + r * Math.sin(a);
    return `M${x1.toFixed(2)},${y1.toFixed(2)} A${r},${r} 0 0 1 ${x2.toFixed(2)},${y2.toFixed(2)}`;
  };

  const A1 = arc(R1), A2 = arc(R2), A3 = arc(R3);
  const TO = `transform-origin:${HX}px ${HY}px`;

  const wave = (dur, d = 0) =>
    `animation:pl-arc-wave ${dur}s cubic-bezier(.4,0,.2,1) ${d}s infinite;${TO}`;
  const grow = (d = 0) =>
    `animation:pl-arc-grow 1.8s cubic-bezier(.4,0,.6,1) ${d}s infinite;${TO}`;

  const OC = (r) => {
    const c = 2 * Math.PI * r;
    return `${(c * 0.22).toFixed(1)} ${(c * 0.78).toFixed(1)}`;
  };
  const PC = (r) => {
    const c = 2 * Math.PI * r;
    return `${(c * 0.30).toFixed(1)} ${(c * 0.70).toFixed(1)}`;
  };

  const states = {
    loading: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+16}" fill="url(#pl-gg)" style="animation:pl-glow-breathe 2s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0" style="${wave(2)}"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0" style="${wave(2,.4)}"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0" style="${wave(2,.8)}"/>`,
    },
    connecting: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+16}" fill="url(#pl-gg)" style="animation:pl-glow-breathe 1.5s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0" style="${wave(1.5)}"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0" style="${wave(1.5,.28)}"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0" style="${wave(1.5,.56)}"/>`,
    },
    syncing: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+20}" fill="none" stroke="#00E5FF" stroke-width="1.5" stroke-dasharray="${OC(HR+20)}" stroke-linecap="round" opacity="0" style="animation:pl-orbit-spin 1.4s linear infinite;${TO}"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+16}" fill="url(#pl-gg)" style="animation:pl-glow-breathe 1.2s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0" style="${wave(1.2)}"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0" style="${wave(1.2,.22)}"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0" style="${wave(1.2,.44)}"/>`,
    },
    success: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+16}" fill="url(#pl-gg)" style="animation:pl-glow-breathe 2s ease-in-out infinite"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+8}"  fill="none" stroke="#00C853" stroke-width="2.5" opacity="0" style="animation:pl-success-ring 2.5s ease-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round"/>
          <circle cx="${HX+20}" cy="${HY+20}" r="12" fill="#00C853"/>
          <path d="M${HX+13},${HY+20} L${HX+19},${HY+26} L${HX+28},${HY+13}" fill="none" stroke="white" stroke-width="2.3" stroke-linecap="round" stroke-linejoin="round" stroke-dasharray="24" style="animation:pl-check-draw 2.5s ease infinite"/>`,
    },
    offline: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+18}" fill="none" stroke="#374151" stroke-width="1.5" stroke-dasharray="6 5" opacity="0.55"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+14}" fill="url(#pl-gg)" opacity="0.18" style="animation:pl-glow-dim 3s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="#4B5563" stroke-width="5.5" stroke-linecap="round" style="animation:pl-glow-dim 2.5s ease-in-out infinite"/>
          <path d="${A2}" fill="none" stroke="#374151" stroke-width="4.5" stroke-linecap="round" style="animation:pl-glow-dim 2.5s ease-in-out .4s infinite"/>
          <path d="${A3}" fill="none" stroke="#1F2937" stroke-width="3.5" stroke-linecap="round" style="animation:pl-glow-dim 2.5s ease-in-out .8s infinite"/>
          <circle cx="${HX+20}" cy="${HY+20}" r="12" fill="none" stroke="#F44336" stroke-width="2.2"/>
          <line x1="${HX+13}" y1="${HY+13}" x2="${HX+27}" y2="${HY+27}" stroke="#F44336" stroke-width="2.2" stroke-linecap="round"/>
          <line x1="${HX+27}" y1="${HY+13}" x2="${HX+13}" y2="${HY+27}" stroke="#F44336" stroke-width="2.2" stroke-linecap="round"/>`,
    },
    error: {
      shake: true,
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+22}" fill="url(#pl-eg)" opacity="0" style="animation:pl-error-bg 2s ease-in-out infinite"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+9}"  fill="none" stroke="#F44336" stroke-width="2.5" opacity="0" style="animation:pl-error-ring 2s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="#EF4444" stroke-width="5.5" stroke-linecap="round" opacity="0.65"/>
          <path d="${A2}" fill="none" stroke="#EF4444" stroke-width="4.5" stroke-linecap="round" opacity="0.28"/>
          <polygon points="${HX+20},${HY+7} ${HX+32},${HY+27} ${HX+8},${HY+27}" fill="#FF9800" opacity="0" style="animation:pl-amber-flash 2s ease-in-out .15s infinite"/>
          <line x1="${HX+20}" y1="${HY+12}" x2="${HX+20}" y2="${HY+19}" stroke="white" stroke-width="2.2" stroke-linecap="round" opacity="0" style="animation:pl-amber-flash 2s ease-in-out .15s infinite"/>
          <circle cx="${HX+20}" cy="${HY+23}" r="1.5" fill="white" opacity="0" style="animation:pl-amber-flash 2s ease-in-out .15s infinite"/>`,
    },
    retry: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+18}" fill="none" stroke="#1E3A8A" stroke-width="1.2" stroke-dasharray="4 5" opacity="0.45" style="animation:pl-orbit-spin 3s linear infinite;${TO}"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+14}" fill="url(#pl-gg)" style="animation:pl-glow-breathe 1.8s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0" style="${grow(0)}"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0" style="${grow(.3)}"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0" style="${grow(.6)}"/>`,
    },
    searching: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+28}" fill="none" stroke="#1E3A8A" stroke-width="0.8" opacity="0.35"/>
          <line x1="${HX}" y1="${HY}" x2="${HX}" y2="${(HY-HR-28).toFixed(1)}" stroke="#00E5FF" stroke-width="1.8" opacity="0.5" style="animation:pl-scan-rotate 2.5s linear infinite;${TO}"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+14}" fill="url(#pl-gg)" style="animation:pl-glow-dim 2.5s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0" style="${wave(2.4,0)}"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0" style="${wave(2.4,.6)}"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0" style="${wave(2.4,1.2)}"/>`,
    },
    processing: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+19}" fill="none" stroke="#00E5FF" stroke-width="2.8" stroke-dasharray="${PC(HR+19)}" stroke-linecap="round" opacity="0.8" style="animation:pl-process-spin 1s linear infinite;${TO}"/>
          <circle cx="${HX}" cy="${HY}" r="${HR+14}" fill="url(#pl-gg)" style="animation:pl-glow-breathe 1.3s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0" style="${wave(1.3,0)}"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0" style="${wave(1.3,.22)}"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0" style="${wave(1.3,.44)}"/>`,
    },
    idle: {
      b: `<circle cx="${HX}" cy="${HY}" r="${HR+14}" fill="url(#pl-gg)" opacity="0.3" style="animation:pl-glow-idle 4s ease-in-out infinite"/>`,
      o: `<path d="${A1}" fill="none" stroke="url(#pl-ag)" stroke-width="5.5" stroke-linecap="round" opacity="0.22"/>
          <path d="${A2}" fill="none" stroke="url(#pl-ag)" stroke-width="4.5" stroke-linecap="round" opacity="0.1"/>
          <path d="${A3}" fill="none" stroke="url(#pl-ag)" stroke-width="3.5" stroke-linecap="round" opacity="0.04"/>`,
    },
  };

  const s = states[state] || states.idle;
  const shakeStyle = s.shake
    ? "animation:pl-shake .65s cubic-bezier(.36,.07,.19,.97) .3s infinite"
    : "";

  return (
    <div data-pl style={{ width:size, height:h, flexShrink:0, ...wx }}
         role="img" aria-label={`PROFILE logo – ${state}`}>
      <svg width={size} height={h} viewBox={`0 0 ${VW} ${VH}`}
           xmlns="http://www.w3.org/2000/svg" style={{ display:"block", overflow:"visible" }}>
        <defs>
          <radialGradient id="pl-rg" cx="38%" cy="32%" r="62%">
            <stop offset="0%"   stopColor="#7DD3FC"/>
            <stop offset="35%"  stopColor="#2563EB"/>
            <stop offset="100%" stopColor="#0A1F5C"/>
          </radialGradient>
          <radialGradient id="pl-gg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#00E5FF" stopOpacity="0.78"/>
            <stop offset="100%" stopColor="#00E5FF" stopOpacity="0"/>
          </radialGradient>
          <radialGradient id="pl-eg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="#F44336" stopOpacity="0.6"/>
            <stop offset="100%" stopColor="#F44336" stopOpacity="0"/>
          </radialGradient>
          <linearGradient id="pl-ag" x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%"   stopColor="#00E5FF"/>
            <stop offset="100%" stopColor="#1565C0"/>
          </linearGradient>
          <linearGradient id="pl-pg" x1="0%" y1="0%" x2="60%" y2="100%">
            <stop offset="0%"   stopColor="#1E3A8A"/>
            <stop offset="100%" stopColor="#0C1F4A"/>
          </linearGradient>
        </defs>

        <g style={shakeStyle}>
          {/* Behind layer: glow, orbit rings */}
          <g dangerouslySetInnerHTML={{ __html: s.b }}/>

          {/* P letterform — replace <image> elements below if you have the
              official base64 PNG assets from the source SVG file          */}
          <rect x="18" y="28" width="36" height="208" rx="10" fill="url(#pl-pg)"/>
          <path d="M54,28 C54,28 100,28 140,50 C170,68 175,115 155,142 C135,168 100,172 54,170 Z"
                fill="url(#pl-pg)"/>
          <path d="M54,62 C54,62 88,62 118,80 C138,96 140,128 122,142 C104,156 54,138 54,138 Z"
                fill="#060E1C"/>
          {/* Head sphere */}
          <circle cx={HX} cy={HY} r={HR} fill="url(#pl-rg)"/>
          <ellipse cx={HX - 11} cy={HY - 12} rx="10" ry="7" fill="white" opacity="0.22"/>

          {/* Over layer: arc bars, status icons */}
          <g dangerouslySetInnerHTML={{ __html: s.o }}/>
        </g>
      </svg>
    </div>
  );
}
```

---

## STEP 2 — SWAP THE EXISTING DOT LOGO MARKS

There are exactly **three places** where the old `<div style={S.sLogoDot}/>` renders. Replace each one precisely — do not change anything else in those lines.

### 2a. Sidebar logo (App component)

**Find:**
```jsx
<div style={S.sLogo}><div style={S.sLogoDot}/>PROFILE</div>
```
**Replace with:**
```jsx
<div style={S.sLogo}>
  <ProfileLogo state="idle" size={28}/>
  <span>PROFILE</span>
</div>
```

### 2b. Auth — Sign In mode

**Find** (inside `AuthScreen`, the `mode === "signin"` branch):
```jsx
<div style={{ fontSize:20, fontWeight:800, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}><div style={S.sLogoDot}/>PROFILE</div>
```
**Replace with:**
```jsx
<div style={{ fontSize:20, fontWeight:800, marginBottom:6, display:"flex", alignItems:"center", gap:8 }}>
  <ProfileLogo state="connecting" size={32}/>
  PROFILE
</div>
```

### 2c. Auth — Sign Up / Registration mode

**Find** (inside `AuthScreen`, the registration branch — the first line after `{mode !== "signin" && (`):
```jsx
<div style={{ fontSize:20, fontWeight:800, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}><div style={S.sLogoDot}/>PROFILE</div>
```
**Replace with:**
```jsx
<div style={{ fontSize:20, fontWeight:800, marginBottom:10, display:"flex", alignItems:"center", gap:8 }}>
  <ProfileLogo state="loading" size={32}/>
  PROFILE
</div>
```

---

## STEP 3 — ADD CONTEXTUAL STATES TO KEY MOMENTS

Each addition is a **small, targeted insertion** into an existing component. Do not rewrite the component — only add the lines shown.

### 3a. Empty / loading states across pages

Anywhere a page shows a blank state or loading placeholder, replace or precede it with:
```jsx
<div style={{ display:"flex", flexDirection:"column", alignItems:"center", padding:48, gap:16 }}>
  <ProfileLogo state="loading" size={64}/>
  <div style={{ fontSize:13, color:T.txt3 }}>Loading your professional world...</div>
</div>
```

### 3b. Search in DiscoverPage

Inside `DiscoverPage`, add a `searching` boolean state, then wrap the Search button:

```jsx
// 1. Add at the top of DiscoverPage:
const [searching, setSearching] = useState(false);

// 2. Replace the existing <Btn variant="primary" size="sm">Search</Btn> with:
<div style={{ display:"flex", alignItems:"center", gap:8 }}>
  {searching && <ProfileLogo state="searching" size={32}/>}
  <Btn variant="primary" size="sm"
    onClick={() => { setSearching(true); setTimeout(() => setSearching(false), 2000); }}>
    Search
  </Btn>
</div>
```

### 3c. Publish confirmation in PostModal

```jsx
// 1. Add at the top of PostModal:
const [published, setPublished] = useState(false);

// 2. In the publish() function, after onPublish(...) and before onClose():
setPublished(true);
setTimeout(() => setPublished(false), 2200);

// 3. In the modal footer row, before the "Publish activity" Btn:
{published && <ProfileLogo state="success" size={28}/>}
```

### 3d. Message sending state in MessagesPage

```jsx
// 1. Add at the top of MessagesPage:
const [sending, setSending] = useState(false);

// 2. Wrap the existing send() function body:
const send = () => {
  if (!input.trim()) return;
  setSending(true);
  setChat(c => [...c, { sent:true, t:input, time:"now" }]);
  setInput("");
  setTimeout(() => {
    setChat(c => [...c, { sent:false, t:"Sounds great! Let me share the project brief with you 👍", time:"now" }]);
    setSending(false);
  }, 1200);
};

// 3. In the send button row, immediately before the send <button>:
{sending && <ProfileLogo state="connecting" size={24} style={{ marginRight:4 }}/>}
```

### 3e. CV generation indicator in CVPage

```jsx
// In CVPage, alongside the "Download" Btn (premium), add before it:
<ProfileLogo state="processing" size={28}/>
// Display it only when a template switch is in progress:
// Add: const [switching, setSwitching] = useState(false);
// Wrap setActiveTpl: setSwitching(true); setActiveTpl(i); setTimeout(()=>setSwitching(false),800);
// Render: {switching && <ProfileLogo state="processing" size={28}/>}
```

---

## HARD RULES — READ BEFORE GENERATING ANY CODE

```
✓  ProfileLogo is a standalone pure functional component.
   Place it ONCE in the file, after Toast, before data constants.

✓  CSS is injected once via an IIFE with a document.getElementById guard.
   All keyframe names are prefixed "pl-" to prevent collisions.

✓  dangerouslySetInnerHTML is used only for the SVG animation layer.
   The strings are 100% authored constants — no user data ever enters them.

✓  The data-pl attribute on the wrapper div scopes the
   prefers-reduced-motion CSS selector cleanly.

✓  size and state are the only props. Both have safe defaults.
   The component never throws — unknown state values fall back to "idle".

✓  No imports added. No external packages. No build step changes.

✓  Do not rename T, S, or any existing component.

✓  Do not alter routing logic, page components, or existing state.

✓  If the official base64 PNG assets from the source SVG are available,
   swap the <rect>/<path>/<circle> P-shape for two <image> elements:
     <image href={IMG3_DATA_URI} x="72.93" y="36.46" width="254.20" height="326.80"/>
     <image href={IMG1_DATA_URI} x="112.54" y="74.35" width="176.20" height="289.50"/>
   The gradients, arc paths, and all animation layers remain identical.

✗  Do not spin, bounce, flip, or scale-distort the logo itself.
✗  Do not add a splash screen or block any user flow with animation.
✗  Do not animate the logo continuously in the sidebar — use "idle" there.
✗  Do not create a separate CSS file, module, or styled-component.
✗  Do not use useEffect or useRef inside ProfileLogo.
```

---

## QUICK REFERENCE — STATE → TRIGGER

| State | When to use |
|---|---|
| `"loading"` | App boot · page navigation · data fetch · registration flow |
| `"connecting"` | Sign-in screen · API authentication · server connection |
| `"syncing"` | File upload · background sync · credential submission |
| `"success"` | Form saved · verification approved · post published |
| `"offline"` | No internet detected |
| `"error"` | API failure · server error · form validation error |
| `"retry"` | User retrying after failure · auto-reconnect attempt |
| `"searching"` | Discover search active · smart search · talent search |
| `"processing"` | CV generation · Trust Score calculation · AI processing |
| `"idle"` | Sidebar logo · topbar · any ambient resting context |

---

*Apply in order: Step 1 → Step 2 → Step 3. After each step, confirm the app renders without console errors before continuing.*
