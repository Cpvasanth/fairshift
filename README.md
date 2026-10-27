# FairShift: every shift gets a receipt

![CI](https://github.com/Cpvasanth/fairshift/actions/workflows/ci.yml/badge.svg)

Live: https://fairshift-five.vercel.app · Prompt Wars 2026 · UN SDG 8 (Decent work)

Construction sites and college campuses run their workforce on paper registers. The register belongs to the boss,
so pay is opaque, complaints get traced, and hazards are ignored until someone is hurt. FairShift makes the
worker's phone a second register: their own copy of hours, pay math and the status of every report, in Tamil.

## Chosen vertical

**UN SDG 8, Decent work and economic growth** (targets 8.5 equal pay, 8.8 labour rights and safe work). Persona: a
daily-wage or contract worker (mason, helper, security guard, housekeeping) who speaks Tamil, uses a low-end Android
phone and has no say over the paper register. Second persona: the site admin who needs to see hazards and overwork early.

## Approach and logic

- **Context decides the logic.** Each worker belongs to a site, and each site runs a rule pack (`lib/rules.ts`): wage
  basis, overtime thresholds, hazard categories, severity floors, feedback themes. The same report or the same 12-hour
  shift gives a different, correct result on a construction site and on a college campus.
- **AI listens, rules decide.** Gemini turns Tamil speech or text into schema-constrained JSON. Pay, overtime, fatigue
  flags, severity floors and the Sealed Voice unlock threshold are plain functions with unit tests.
- **Decisions are explainable.** Every flag states its rule and an action ("13 days without rest: schedule a day off").

## How it works

| Screen | What it does | Code |
|---|---|---|
| Landing page `/` | Live Shift Receipt hero, key figures, problem → features story, worker tiles, rule-pack comparison | `app/page.tsx` |
| Worker app `/w/[id]` | Key figures and the worker's own rest flags; weekly pay receipt with overtime bars and Tamil read-aloud; Voice Hazard recorder; "Speak up (sealed)" | `app/w/[id]/page.tsx`, `components/HazardReporter.tsx`, `components/SpeakButton.tsx` |
| Admin dashboard `/admin?site=` | Key figures, hazard-resolution gauge, crew hours chart, worker × day heatmap, filterable live hazards (cards on phones), attention list, Sealed Voice, crew pay table with CSV export | `app/admin/page.tsx`, `components/LiveWidgets.tsx`, `components/Kpi.tsx` |
| Live data | One poller for the whole dashboard (4s, 204 when unchanged, paused when hidden) | `components/live.tsx` |
| Shared UI | One look on all three screens: top bar, cards, key figures, status pills | `components/TopBar.tsx`, `components/Card.tsx`, `components/Kpi.tsx`, `components/StatusBadge.tsx` |
| API | Hazards POST/GET/PATCH and Sealed Voice in one route (shares one in-memory store) | `app/api/hazards/route.ts`, `lib/store.ts` |
| Rules (tested) | Pay, fatigue, severity floor, Sealed Voice grouping, rule packs, rate limit | `lib/pay.ts`, `lib/fatigue.ts`, `lib/severity.ts`, `lib/sealed.ts`, `lib/rules.ts`, `lib/ratelimit.ts` |
| AI | Gemini, schema-constrained JSON, temperature 0, falls back across models on quota errors | `lib/ai.ts` |

## Assumptions

- Demo workers, sites and shifts are fictional and seeded relative to server start (`lib/seed.ts`).
- Overtime is 2× beyond 8h/day or 48h/week; monthly wages assume 26 working days. These are illustrative defaults.
- Workers have a phone with Chrome; Tamil read-aloud needs a Tamil text-to-speech voice and hides itself otherwise.
- One warm server instance serves the demo (in-memory store); a real deployment would use a database.

## Brief → feature → code → SDG 8

| Worker pain | FairShift feature | Code | SDG 8 target |
|---|---|---|---|
| Pay and overtime are opaque | **Shift Receipt**: day-by-day hours, regular × rate, overtime × 2 × rate, total owed, read aloud in Tamil | `lib/pay.ts`, `app/w/[id]/page.tsx` | 8.5 equal pay, 8.8 labour rights |
| Hazards ignored, reporters identified | **Voice Hazard**: speak or type in Tamil → Gemini → HIGH card on the admin board → Acknowledged → Fixed → status read aloud on the worker's phone. No reporter identity stored | `app/api/hazards/route.ts`, `lib/ai.ts`, `lib/severity.ts`, `components/HazardReporter.tsx` | 8.8 safe working environments |
| Overwork goes unseen | **Attention list**: explainable fatigue flags with an action ("13 days without rest: schedule a day off") | `lib/fatigue.ts`, `app/admin/page.tsx` | 8.8, 8.5 |

**AI listens, rules decide.** Gemini only converts speech/text into structured JSON (schema-constrained,
temperature 0, validated with zod). Money and alerts are plain functions with unit tests. Gemini never touches a
rupee, and it can raise a hazard's severity but never lower it below the rule pack's floor.

## Cross-industry: config, not code

| | Construction site | College campus |
|---|---|---|
| Wage basis | daily (Rs 700/day) | monthly (Rs 15,000) |
| Overtime | 2× beyond 8h/day or 48h/week | 2× beyond 8h/day or 48h/week |
| Hazard categories | fall from height, scaffolding, electrical, no PPE, heat stress | electrical, lab chemical, fire exit blocked, structural damage, slippery floor |
| Severity floor (HIGH) | fall from height, electrical | electrical, fire exit blocked |

A hospital or factory is one more entry in `lib/rules.ts`. Defaults are illustrative; verify the applicable state
rule before using real figures. Under this pack a 12-hour guard shift is worth two 8-hour days of pay.

## Architecture

```
Worker phone (/w/[id])            Admin (/admin?site=...)
   record / type / poll status       poll every 4s (204 when unchanged)
            \                         /
          Next.js 16 on Vercel: /api/hazards (POST, GET, PATCH)
            lib/* pure functions (pay, fatigue, severity, rules)
            lib/ai.ts -> Gemini API (Flash-Lite, falls back across models on quota errors), server-only key
```

## Run, test, deploy

```bash
npm install
cp .env.example .env.local   # set GEMINI_API_KEY (server-only, never NEXT_PUBLIC_)
npm run dev
npm test                     # Vitest: pay, fatigue, severity, sealed, rate limit
npm run lint
```

Deploy: push to `main`; Vercel builds it. `GEMINI_API_KEY` is set as a Vercel sensitive environment variable.
Demo workers (fictional): Murugan and Selvi (construction), Ravi and Lakshmi (college).

## Security and accessibility

- No keys in the repo or the browser bundle: the Gemini key is a server-only Vercel secret; `.env*` is gitignored.
- Every request body is validated (zod, size caps: audio ≤ 1 MB, text ≤ 500 chars). Audio is processed and discarded.
- Rate limit: each client may file 8 reports per 10 minutes (`429` + `Retry-After`), which also protects the Gemini
  quota. The limiter key lives in memory for the window only and is never logged or stored with a report.
- Prompt injection: the system instruction treats the report as data; output is schema-constrained; React escapes display.
- Headers: `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: microphone=(self)`.
- Real buttons and labels, skip link, 3px focus ring, 48px+ targets, mic is a toggle with `aria-pressed` and a visible
  timer (keyboard-usable), severity is icon + word + color, overtime bars use a stripe pattern, `lang="ta"` on Tamil
  text, `role="status"` / `aria-live` for updates. Read-aloud only uses a Tamil voice; it hides rather than reading
  Tamil with an English voice.
- Checked with Lighthouse: accessibility 100 on `/`, `/admin` and `/w/murugan`, mobile and desktop. Layouts verified
  at 1440px and 390px with no horizontal scrolling; on phones the hazard table becomes cards so actions stay on screen.

## Limitations (honest)

- Demo store is in memory behind one API route: it resets on a cold start and assumes one warm instance. Next step:
  Supabase or Upstash Redis.
- No login yet: worker and admin pages are open for the demo. Next step: PIN login and an admin role check.
- Gemini free tier allows about 20 requests per model per day; `lib/ai.ts` falls through several models on 429s. Google may use submitted content to improve its products; a production deployment should use a
  paid tier or Vertex AI.
- Hosting logs keep IP and time, so someone with project access could correlate anonymous reports.
- Rule packs are defaults, not legal advice.
