# PIPELINE FORENSICS REPORT — Stage R0

**Date:** 2026-09-19
**Scope:** Confirm or eliminate H1–H12 for symptoms S1–S4, per the Pipeline Repair brief.
**Method:** Direct code inspection of the deployed repository (`Profile-app`), dependency audit, and architecture read. No functional changes made in this pass, per the brief's own Stage R0 instruction ("no functional fixes yet... stop and post the report before Stage R1 begins").

---

## Headline finding

**There is no backend, no database, and no server in this application, anywhere, for any domain entity.** This is not a partial regression or a misconfigured environment — it is the entire and only architecture this codebase has ever had, across every phase of this project to date. H1 is confirmed as the root cause of S1, S2, S3, and S4 simultaneously, and it is not a bug fixable "in place" by patching a query or a filter. It requires building server-side infrastructure that has never existed in this project.

This report exists to give you that evidence before any Stage R1 work begins, per the brief's own gate.

---

## H1 — Client-only persistence: **CONFIRMED, exhaustively**

### Dependency audit (`package.json`)

```json
"dependencies": {
  "@anthropic-ai/sdk": "^0.126.0",
  "framer-motion": "^11.11.17",
  "react": "^19.0.0",
  "react-dom": "^19.0.0",
  "react-router-dom": "^6.28.0",
  "zustand": "^5.0.1"
}
```

No database driver or ORM (no `pg`, `mongodb`, `prisma`, `drizzle`, `mysql2`). No auth service SDK (no `next-auth`, `@clerk/*`, `@auth0/*`, `firebase-auth`). No search service SDK (no `algolia`, `@elastic/*`, `meilisearch`). No object-storage SDK (no `@aws-sdk/client-s3`, `cloudinary`, `@vercel/blob`). The only non-frontend dependency is the Anthropic SDK, used by exactly one serverless function.

### The entire "backend" of this application

```
api/
├── advisor.ts       # one Vercel serverless function: proxies a single
│                    #   chat completion to Anthropic for the PROFILE
│                    #   Advisor feature. Stateless. Reads and writes
│                    #   nothing. No database connection of any kind.
└── tsconfig.json
```

`vercel.json`'s only rule routes everything except `/api/*` to `index.html` — this is a static single-page app with one stateless serverless function bolted on. There is no database connection string anywhere in the repo, no environment variable for one, no ORM schema, no migration folder.

### Where every domain entity actually lives

`grep -rl "localStorage" src/app/*.ts` returns **40 files** — one per entity type, each following the identical pattern (shown here for accounts, but true of all 40):

```ts
// src/app/demoAccountStore.ts
const STORAGE_KEY = 'profile:demo-accounts'
function readAll(): DemoAccountRecord[] {
  const raw = localStorage.getItem(STORAGE_KEY)
  return raw ? JSON.parse(raw) : []
}
function writeAll(records) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
}
```

The 40 keys cover, without exception, every entity category named in the brief: accounts, activities, comments, connections, follows, messages, notifications, jobs, applications, media, disputes, org staff/audit logs, ad campaigns, community discussions/memberships, mentorship, CV/portfolio data, learning enrollments, login history, and more. There is no entity in this application — none — that is persisted anywhere other than the requesting browser's own `localStorage`.

`localStorage` is, by web-platform design, private to one browser profile on one device. It is never transmitted to any server, never shared between browsers, and is wiped by a private window, a different browser, a different device, or the user clearing site data.

### The "search" implementation

```ts
// src/shared/ui/CommandPalette.tsx
/**
 * ...People/organisation results come from `listAllAccounts()` — every
 * account actually registered on this browser, never fabricated profiles
 * — and only accounts with a `username` are included...
 */
const people = useMemo<PersonResult[]>(() => {
  if (!account && !staffRole) return []
  return listAllAccounts()
    .filter((a) => 'username' in a && a.username)
    ...
```

`listAllAccounts()` is a synchronous, in-process read of `localStorage.getItem('profile:demo-accounts')`. There is no search index, no indexing pipeline, no backfill job, because there is no second machine or database for an index to live in or be built from. The comment `"every account actually registered on this browser"` was written by a prior pass on this exact codebase as an honest, deliberate disclosure of this limitation — it is not a leftover bug marker, it is the accurate current-state description.

### Direct proof against the brief's own reproduction steps (§3.2)

The brief specifies: *"Register Users A–E in separate contexts... B–E open Home and search for A."* Given the above, this reproduction's outcome is not just predicted but structurally guaranteed to fail today: User A's registration writes exclusively to User A's own browser's `localStorage`. No code path in this repository transmits that write anywhere User B's browser (a different `localStorage` origin instance, and in the brief's own reproduction, a genuinely different device) could ever read it from. This is true regardless of network conditions, caching, indexing lag, or authorization logic — there is no wire between the two browsers for this data to cross.

---

## H2 — Environment split: **not applicable / subsumed by H1**

There is only one environment (the static Vercel deployment) and it has no backend to split. The symptom is fully explained by H1 without needing a second cause.

## H3 — Registration doesn't create public-facing records: **not applicable**

Registration does create a full, correct record (`OrganisationAccount`/`IndividualAccount`, with `username`, `registryLevel`, etc.) — the record itself is well-formed. It is simply written to a storage layer (`localStorage`) that only the writer's own browser can ever read. This is a placement problem (H1), not a field-completeness problem.

## H4 — Search reads a static/unpopulated index: **confirmed, but as a consequence of H1, not a separate defect**

There is no index at all, static or otherwise — see the CommandPalette evidence above. "Populating an index" is not a smaller fix here; it requires the index (and the service to host it) to first exist.

## H5–H12

Not meaningfully separable from H1 in this codebase: there are no authorization policies to be over-restrictive (H5) because there is no shared row a policy could gate; no visibility defaults to mis-set at the network layer (H6) beyond what's already client-side correct (new activities do default to `public` in the local store); no ranking-as-filter logic exists yet because there is no cross-user query for it to filter (H7); search matching quality (H8) is moot until results can include more than one browser's own data; there is no cache to go stale (H9) beyond normal React re-render behavior; identity fields are internally consistent within a single browser's own account record (H10); routes render correctly for the signed-in browser's own data (H11) — the missing piece is exclusively that no other browser's data ever arrives; and media is already known and disclosed elsewhere in this codebase to be stored as base64 data URLs inside the same-per-browser `localStorage` records (H12), which is consistent with, not separate from, H1.

---

## What this means for S1–S4

| Symptom | Root cause |
|---|---|
| S1 — new accounts invisible to other users | H1. Each account exists only in its creator's browser. |
| S2 — cross-device search returns nothing | H1. The "index" `CommandPalette` reads is one browser's `localStorage`. |
| S3 — Profile feels like a personal dashboard | Downstream of H1: Home/Search can only ever show the viewing browser's own data, so in practice the only content a user ever reliably sees is their own — which reads as "Profile is where I see my stuff" even though the Profile *component* itself is already coded as a public-identity page. |
| S4 — avatar only shows on Profile | Separate, real, fixable-in-place defect — see below. Not caused by H1. |

### S4 is a genuine, narrower defect — not blocked by the architecture question

Unlike S1–S3, this one does **not** require a backend to fix, and I want to flag it as workable independently: it's a case of `ActivityCard`/feed rendering not consistently resolving the author's current avatar the way the Profile page does. This is exactly Stage R6 in the brief and is normal, in-place frontend work — I can pick this up immediately regardless of how the S1–S3 question is resolved.

---

## "Present but non-functional" register (extends the brief's §49.2 pattern, partial — full sweep is Stage R9)

| Item | Location | Status |
|---|---|---|
| Cross-browser account discovery | `demoAccountStore.ts`, all consumers | Structurally impossible without a backend (not a bug in the consumer code) |
| Universal Search | `CommandPalette.tsx` | Searches one browser's own `localStorage` only |
| Messaging between real separate users | `messageStore.ts` | Same-browser only — two accounts can message each other only if both exist in the *same* browser's storage (e.g., via the dev account switcher), never across real separate people |
| Notifications to another real user | `notificationStore.ts` | Same limitation — a notification "to" another account only becomes visible if that account is later opened in the *same* browser |
| File/media storage | `mediaStore.ts` (per `profile:demo-media`) | Data URLs in `localStorage`, size-limited by browser storage quotas, never reaches a second device |

---

## The decision this report exists to surface

The brief's Stage R1 opens with: *"Every entity persists server-side in one shared store."* Implementing that sentence truthfully means standing up, for the first time in this project's history:

- A real database and a hosting/runtime for a real backend (this app currently deploys as a static site to Vercel with one stateless serverless function; a stateful multi-user backend is a materially different infrastructure commitment — hosting choice, database choice, and ongoing cost, are real decisions, not implementation details).
- Real authentication (sessions/tokens verified server-side; today "auth" is `AccountContext` choosing which `localStorage` record to treat as "me," with no password check beyond client-side and a dev account-switcher for testing).
- A real search service or a self-built index (the brief mentions <500ms query targets and event-driven reindexing — this is a service, not a query tweak).
- Real file storage with server-side content sniffing, virus scanning, transcoding, and signed URLs (today: base64 in `localStorage`).
- A moderation, rate-limiting, and abuse-detection layer where currently none exists at all (client-side only, and only where a screen already disclosed it as illustrative).

This is not a "fix the root cause in place" change of the kind every other pass on this codebase has been (all of which — correctly, per this project's own standing rules — extended the existing client-only architecture rather than replacing it). It is a different project: a real multi-user backend service, built from zero, underneath an existing frontend that was never designed to talk to one. I'm not raising this to avoid the work — I'm raising it because the brief's own Working Rule 1 is "evidence before edits," and the evidence says Stage R1 as literally written is a from-scratch backend build, not a repair.

I have not started Stage R1. Per the brief's own instruction, I'm stopping here for direction on how you want to handle that gap before I commit to an approach (or a much narrower scope) for the stateful, cross-device parts of this brief. S4 (avatar placement) and the mechanical Stage R9 sweep for client-side-only defects are both real, in-place fixes I can start immediately if useful while that's decided.
