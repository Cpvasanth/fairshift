import {
  ArrowRight,
  BrainCircuit,
  Brush,
  ClipboardList,
  Factory,
  GraduationCap,
  HardHat,
  HeartPulse,
  Hospital,
  LayoutDashboard,
  LockKeyhole,
  Mic,
  Receipt,
  Scale,
  ShieldCheck,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import { flags } from "@/lib/fatigue";
import { computeWeek, hours, rupees } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, seededAt, workers } from "@/lib/seed";

const roleIcon: Record<string, typeof HardHat> = { murugan: HardHat, selvi: HardHat, ravi: ShieldCheck, lakshmi: Brush };
const siteIcon: Record<string, typeof HardHat> = { construction: HardHat, college: GraduationCap };

const features = [
  {
    Icon: Receipt,
    title: "Shift Receipt",
    sdg: "SDG 8.5",
    text: "Every worker sees their own hours, the overtime rule and the exact rupees owed, read aloud in Tamil.",
  },
  {
    Icon: Mic,
    title: "Voice Hazard",
    sdg: "SDG 8.8",
    text: "Speak a danger in Tamil. It reaches the admin board in seconds, and the worker hears when it is fixed.",
  },
  {
    Icon: LockKeyhole,
    title: "Sealed Voice",
    sdg: "SDG 8.8",
    text: "Anonymous is fake on a five-person crew. Feedback stays sealed until 5 workers raise the same issue.",
  },
  {
    Icon: HeartPulse,
    title: "Attention list",
    sdg: "SDG 8.8",
    text: "Explainable fatigue rules with an action: 13 days without rest means schedule a day off, not a risk score.",
  },
];

const loop = [
  { Icon: Mic, title: "Worker speaks", text: "“Block C scaffolding, third floor, no guardrail” in Tamil, or typed." },
  { Icon: BrainCircuit, title: "Gemini structures it", text: "Transcript, translation, category and severity as validated JSON." },
  { Icon: ClipboardList, title: "Admin acts", text: "A HIGH card appears on the live board. Acknowledge, then mark fixed." },
  { Icon: Volume2, title: "Worker hears it", text: "Their phone reads the new status aloud in Tamil. The loop closes." },
];

export default function Home() {
  const crew = Object.values(workers).map((w) => {
    const pay = computeWeek(recentShifts(w), packs[w.packId], w.wagePaise);
    return { w, pay, flagged: flags(w.shifts, seededAt).length > 0 };
  });
  const otPaise = crew.reduce((a, c) => a + c.pay.otPaise, 0);
  const otHours = hours(crew.reduce((a, c) => a + c.pay.otMinutes, 0));
  const flagged = crew.filter((c) => c.flagged).length;
  const ravi = crew.find((c) => c.w.id === "ravi")!;
  const raviPack = packs[ravi.w.packId];

  const stats = [
    { value: rupees(otPaise).replace(/\.\d+$/, ""), label: `overtime made visible this week (${otHours}h at 2×)` },
    { value: "~2 s", label: "from Tamil voice to a structured hazard" },
    { value: `${flagged} of ${crew.length}`, label: "workers flagged for rest, each with an action" },
    { value: `${Object.keys(packs).length} industries`, label: "one codebase, one rule pack each" },
  ];

  return (
    <div className="bg-slate-50">
      <header className="bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-16 pt-8">
          <nav aria-label="Main" className="flex items-center gap-4">
            <span className="flex items-center gap-2 text-lg font-bold">
              <Receipt aria-hidden="true" className="size-6 text-indigo-300" />
              FairShift
            </span>
            <Link href="/admin" className="ml-auto rounded-lg px-3 py-2 font-semibold text-slate-200 hover:bg-white/10">
              Admin
            </Link>
            <a
              href="https://github.com/Cpvasanth/fairshift"
              className="rounded-lg px-3 py-2 font-semibold text-slate-200 hover:bg-white/10"
            >
              GitHub
            </a>
          </nav>

          <div className="mt-14 grid items-center gap-12 lg:grid-cols-[1.3fr_1fr]">
          <div>
            <p className="inline-flex items-center gap-2 rounded-full border border-indigo-300/60 px-3 py-1 text-sm font-semibold text-indigo-100">
              <Scale aria-hidden="true" className="size-4" />
              UN SDG 8 · Decent work and economic growth
            </p>
            <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-6xl">Every shift gets a receipt.</h1>
            <p lang="ta" className="mt-3 text-xl font-semibold text-indigo-200 sm:text-2xl">
              ஒவ்வொரு ஷிஃப்டுக்கும் ஒரு ரசீது.
            </p>
            <p className="mt-5 text-lg text-slate-300">
              On construction sites and college campuses, the register belongs to the boss. FairShift makes the worker&apos;s phone a
              second register: their own copy of hours, pay math and every safety report, in their own language.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link
                href="/admin"
                className="flex min-h-12 items-center gap-2 rounded-xl bg-white px-5 font-bold text-slate-900 hover:bg-indigo-50"
              >
                <LayoutDashboard aria-hidden="true" className="size-5" />
                Open the admin dashboard
              </Link>
              <a
                href="#workers"
                className="flex min-h-12 items-center gap-2 rounded-xl border border-white/40 px-5 font-bold text-white hover:bg-white/10"
              >
                Try the worker app
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
            </div>
          </div>

          <figure className="mx-auto w-full max-w-sm rounded-2xl bg-white p-6 text-slate-900 shadow-2xl shadow-indigo-950/50 motion-safe:lg:rotate-2">
            <figcaption className="flex items-center justify-between border-b-2 border-dashed border-slate-300 pb-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-600">Shift receipt</span>
              <span className="text-xs text-slate-600">last 7 days</span>
            </figcaption>
            <p className="mt-3 text-lg font-bold">
              {ravi.w.name} · {ravi.w.role}
            </p>
            <p className="text-sm text-slate-600">{raviPack.site}</p>
            <ul aria-label="Hours per night" className="mt-4 flex h-16 items-end gap-1.5">
              {ravi.pay.days.map((d) => {
                const reg = Math.min(d.minutes, raviPack.dailyHours * 60);
                return (
                  <li key={d.date} className="flex h-full flex-1 flex-col justify-end" aria-label={`${d.date}: ${hours(d.minutes)} hours`}>
                    <span
                      className="bg-amber-500"
                      style={{
                        height: `${((d.minutes - reg) / (12 * 60)) * 100}%`,
                        backgroundImage: "repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,.35) 4px 7px)",
                      }}
                    />
                    <span className="rounded-b bg-indigo-700" style={{ height: `${(reg / (12 * 60)) * 100}%` }} />
                  </li>
                );
              })}
            </ul>
            <dl className="mt-4 space-y-1.5 font-mono text-sm tabular-nums">
              <div className="flex justify-between gap-3">
                <dt>
                  Regular {hours(ravi.pay.regularMinutes)}h × {rupees(ravi.pay.ratePaisePerHour)}
                </dt>
                <dd>{rupees(ravi.pay.regularPaise)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt>
                  Overtime {hours(ravi.pay.otMinutes)}h × {raviPack.otMultiplier}
                </dt>
                <dd>{rupees(ravi.pay.otPaise)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t-2 border-slate-900 pt-2 text-base font-bold">
                <dt>Owed to Ravi</dt>
                <dd>{rupees(ravi.pay.totalPaise)}</dd>
              </div>
            </dl>
            <p className="mt-3 rounded-lg bg-amber-50 p-2 text-sm text-amber-950">
              A 12-hour night is worth two 8-hour days. The paper register pays one.
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Volume2 aria-hidden="true" className="size-4" />
              <span lang="ta">படித்துக் காட்டு</span> · read aloud in Tamil
            </p>
          </figure>
          </div>
        </div>
      </header>

      <main id="main">
        <section aria-label="FairShift in numbers" className="mx-auto -mt-8 max-w-6xl px-4">
          <dl className="grid grid-cols-1 gap-4 rounded-2xl border border-slate-200 bg-white p-5 shadow-lg sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col-reverse justify-end">
                <dt className="text-sm text-slate-600">{s.label}</dt>
                <dd className="text-3xl font-bold tracking-tight text-slate-900">{s.value}</dd>
              </div>
            ))}
          </dl>
        </section>

        <section aria-labelledby="problem-h" className="mx-auto max-w-6xl px-4 pt-16">
          <h2 id="problem-h" className="text-3xl font-bold text-slate-900">
            The problem is who holds the register
          </h2>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {[
              ["Pay is opaque", "The boss holds the hours, so overtime quietly disappears. A 12-hour guard shift is worth two days' pay; the register pays one."],
              ["Complaints get traced", "On a crew of five, “anonymous” feedback points straight back at the person who spoke up."],
              ["Hazards wait for injuries", "Reports in WhatsApp groups and regional languages never reach anyone who can fix them."],
            ].map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-200 bg-white p-5">
                <h3 className="text-lg font-bold text-slate-900">{t}</h3>
                <p className="mt-2 text-slate-700">{d}</p>
              </div>
            ))}
          </div>
        </section>

        <section aria-labelledby="features-h" className="mx-auto max-w-6xl px-4 pt-16">
          <h2 id="features-h" className="text-3xl font-bold text-slate-900">
            Four features, one idea
          </h2>
          <p className="mt-2 text-lg text-slate-700">Give the worker their own copy of the facts.</p>
          <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ Icon, title, sdg, text }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                <span className="w-fit rounded-xl bg-indigo-100 p-2.5 text-indigo-800">
                  <Icon aria-hidden="true" className="size-6" />
                </span>
                <h3 className="mt-4 text-lg font-bold text-slate-900">{title}</h3>
                <p className="mt-2 flex-1 text-slate-700">{text}</p>
                <span className="mt-4 w-fit rounded-full bg-slate-900 px-2.5 py-0.5 text-xs font-bold text-white">{sdg}</span>
              </li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="loop-h" className="mx-auto max-w-6xl px-4 pt-16">
          <h2 id="loop-h" className="text-3xl font-bold text-slate-900">
            The hazard loop closes on the worker&apos;s phone
          </h2>
          <ol className="mt-6 grid gap-4 md:grid-cols-4">
            {loop.map(({ Icon, title, text }, i) => (
              <li key={title} className="relative rounded-2xl border border-slate-200 bg-white p-5">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-slate-900 font-bold text-white">{i + 1}</span>
                  <Icon aria-hidden="true" className="size-6 text-indigo-700" />
                </span>
                <h3 className="mt-3 font-bold text-slate-900">{title}</h3>
                <p className="mt-1 text-slate-700">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 rounded-xl bg-indigo-50 p-4 text-indigo-950">
            <BrainCircuit aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong>AI listens, rules decide.</strong> Gemini only turns speech into structured data. Pay and alerts are plain,
              unit-tested functions; Gemini never touches a rupee and can never lower a hazard below its rule-pack severity floor.
            </span>
          </p>
        </section>

        <section id="workers" aria-labelledby="workers-h" className="mx-auto max-w-6xl scroll-mt-4 px-4 pt-16">
          <h2 id="workers-h" className="text-3xl font-bold text-slate-900">
            Try the worker app
          </h2>
          <p className="mt-2 text-lg text-slate-700">Built for low-end Android phones: big targets, Tamil first, voice in and out.</p>
          <div className="mt-6 grid gap-6 lg:grid-cols-2">
            {Object.values(packs).map((p) => {
              const SiteIcon = siteIcon[p.id] ?? Factory;
              return (
                <section key={p.id} aria-labelledby={`${p.id}-h`} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <h3 id={`${p.id}-h`} className="flex items-center gap-2 text-xl font-bold text-slate-900">
                    <SiteIcon aria-hidden="true" className="size-6 text-indigo-700" />
                    {p.industry}
                  </h3>
                  <p className="text-slate-600">{p.site}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {crew
                      .filter((c) => c.w.packId === p.id)
                      .map(({ w, pay, flagged }) => {
                        const Icon = roleIcon[w.id] ?? HardHat;
                        return (
                          <li key={w.id}>
                            <Link
                              href={`/w/${w.id}`}
                              className="group flex min-h-28 flex-col rounded-xl border-2 border-slate-200 p-4 hover:border-indigo-700"
                            >
                              <span className="flex items-center gap-2 text-lg font-bold text-slate-900">
                                <Icon aria-hidden="true" className="size-5 text-slate-700" />
                                {w.name}
                                <ArrowRight aria-hidden="true" className="ml-auto size-5 text-slate-500 group-hover:text-indigo-700" />
                              </span>
                              <span className="text-slate-600">{w.role}</span>
                              <span className="mt-2 text-sm text-slate-800">
                                {hours(pay.totalMinutes)}h this week · owed <strong className="whitespace-nowrap">{rupees(pay.totalPaise)}</strong>
                              </span>
                              {flagged && <span className="mt-1 text-sm font-semibold text-red-800">Needs rest</span>}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </section>
              );
            })}
          </div>
        </section>

        <section aria-labelledby="packs-h" className="mx-auto max-w-6xl px-4 py-16">
          <h2 id="packs-h" className="text-3xl font-bold text-slate-900">
            Cross-industry is config, not code
          </h2>
          <p className="mt-2 text-lg text-slate-700">Each site runs on a rule pack. Same app, different rules.</p>
          <div className="mt-6 grid gap-4 md:grid-cols-3">
            {Object.values(packs).map((p) => {
              const Icon = siteIcon[p.id] ?? Factory;
              return (
                <div key={p.id} className="rounded-2xl border border-slate-200 bg-white p-5">
                  <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                    <Icon aria-hidden="true" className="size-5 text-indigo-700" />
                    {p.industry}
                  </h3>
                  <dl className="mt-3 space-y-2 text-slate-800">
                    <div>
                      <dt className="text-sm font-semibold text-slate-600">Wages</dt>
                      <dd className="capitalize">{p.wageBasis}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-600">Overtime</dt>
                      <dd>
                        {p.otMultiplier}× beyond {p.dailyHours}h/day or {p.weeklyHours}h/week
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-600">Always HIGH</dt>
                      <dd className="capitalize">{Object.keys(p.severityFloor).join(", ")}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-semibold text-slate-600">Sealed Voice themes</dt>
                      <dd className="capitalize">{p.themes.filter((t) => t !== "other").join(", ")}</dd>
                    </div>
                  </dl>
                </div>
              );
            })}
            <div className="flex flex-col justify-center rounded-2xl border-2 border-dashed border-slate-300 p-5">
              <h3 className="flex items-center gap-2 text-lg font-bold text-slate-900">
                <Hospital aria-hidden="true" className="size-5 text-indigo-700" />
                Hospital, factory…
              </h3>
              <p className="mt-2 text-slate-700">
                One more entry in <code className="rounded bg-slate-100 px-1">lib/rules.ts</code>: categories, severity floors, wage
                basis. No code changes.
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-4 px-4 py-6 text-sm text-slate-600">
          <span>FairShift · Prompt Wars 2026 · demo data is fictional; rule packs are defaults, not legal advice.</span>
          <a href="https://github.com/Cpvasanth/fairshift" className="ml-auto font-semibold text-slate-900 underline underline-offset-2">
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
