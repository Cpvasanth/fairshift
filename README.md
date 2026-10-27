# FairShift: every shift gets a receipt

![CI](https://github.com/Cpvasanth/fairshift/actions/workflows/ci.yml/badge.svg)

Live: https://fairshift-five.vercel.app · Prompt Wars 2026 · UN SDG 8 (Decent work)

Construction sites and college campuses run their workforce on paper registers. The register belongs to the boss,
so pay is opaque, complaints get traced, and hazards are ignored until someone is hurt. FairShift makes the
worker's phone a second register: their own copy of hours, pay math and the status of every report, in Tamil.

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
npm test                     # Vitest: pay, fatigue, severity
npm run lint
```

Deploy: push to `main`; Vercel builds it. `GEMINI_API_KEY` is set as a Vercel sensitive environment variable.
Demo workers (fictional): Murugan and Selvi (construction), Ravi and Lakshmi (college).

## Security and accessibility

- No keys in the repo or the browser bundle: the Gemini key is a server-only Vercel secret; `.env*` is gitignored.
- Every request body is validated (zod, size caps: audio ≤ 1 MB, text ≤ 500 chars). Audio is processed and discarded.
- Prompt injection: the system instruction treats the report as data; output is schema-constrained; React escapes display.
- Headers: `frame-ancestors 'none'`, `nosniff`, `Referrer-Policy: no-referrer`, `Permissions-Policy: microphone=(self)`.
- Real buttons and labels, skip link, 3px focus ring, 48px+ targets, mic is a toggle with `aria-pressed` and a visible
  timer (keyboard-usable), severity is icon + word + color, overtime bars use a stripe pattern, `lang="ta"` on Tamil
  text, `role="status"` / `aria-live` for updates. Read-aloud only uses a Tamil voice; it hides rather than reading
  Tamil with an English voice.

## Limitations (honest)

- Demo store is in memory behind one API route: it resets on a cold start and assumes one warm instance. Next step:
  Supabase or Upstash Redis.
- No login yet: worker and admin pages are open for the demo. Next step: PIN login and an admin role check.
- Gemini free tier allows about 20 requests per model per day; `lib/ai.ts` falls through several models on 429s. Google may use submitted content to improve its products; a production deployment should use a
  paid tier or Vertex AI.
- Hosting logs keep IP and time, so someone with project access could correlate anonymous reports.
- Rule packs are defaults, not legal advice.
