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
  IndianRupee,
  LayoutDashboard,
  LayoutGrid,
  LockKeyhole,
  Mic,
  Receipt,
  Repeat,
  Scale,
  ShieldCheck,
  Smartphone,
  Sparkles,
  TriangleAlert,
  Users,
  Volume2,
} from "lucide-react";
import Link from "next/link";
import Card from "@/components/Card";
import Kpi from "@/components/Kpi";
import TopBar, { type NavItem } from "@/components/TopBar";
import { flags } from "@/lib/fatigue";
import { computeWeek, hours, inr, rupees, weekday } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, seededAt, workers } from "@/lib/seed";

const roleIcon: Record<string, typeof HardHat> = { murugan: HardHat, selvi: HardHat, ravi: ShieldCheck, lakshmi: Brush };
const siteIcon: Record<string, typeof HardHat> = { construction: HardHat, college: GraduationCap };
const stripes = "repeating-linear-gradient(45deg, transparent 0 5px, rgba(0,0,0,.25) 5px 8px)";
const chip = "w-fit rounded-full px-2.5 py-0.5 text-xs font-semibold ring-1";

const nav: NavItem[] = [
  { href: "#overview", label: "Overview", Icon: LayoutGrid, current: true },
  { href: "#features", label: "Features", Icon: Sparkles },
  { href: "#workers", label: "Worker app", Icon: Smartphone },
  { href: "#packs", label: "Rule packs", Icon: Factory },
];

const problems = [
  {
    Icon: IndianRupee,
    title: "Pay is opaque",
    text: "The boss holds the hours, so overtime quietly disappears. A 12-hour guard shift is worth two days' pay; the register pays one.",
  },
  { Icon: Users, title: "Complaints get traced", text: "On a crew of five, “anonymous” feedback points straight back at the person who spoke up." },
  { Icon: TriangleAlert, title: "Hazards wait for injuries", text: "Reports in WhatsApp groups and regional languages never reach anyone who can fix them." },
];

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
    const rest = flags(w.shifts, seededAt);
    return { w, pay: computeWeek(recentShifts(w), packs[w.packId], w.wagePaise), flagged: rest.length > 0, high: rest.some((f) => f.level === "HIGH") };
  });
  const otPaise = crew.reduce((a, c) => a + c.pay.otPaise, 0);
  const otHours = hours(crew.reduce((a, c) => a + c.pay.otMinutes, 0));
  const ravi = crew.find((c) => c.w.id === "ravi")!;
  const raviPack = packs[ravi.w.packId];
  const raviMax = Math.max(...ravi.pay.days.map((d) => d.minutes), raviPack.dailyHours * 60);

  return (
    <div className="min-h-full bg-slate-100">
      <TopBar nav={nav} navLabel="Page sections">
        <a
          href="https://github.com/Cpvasanth/fairshift"
          className="hidden min-h-11 items-center rounded-xl px-3 text-sm font-semibold text-slate-700 hover:bg-slate-100 sm:flex"
        >
          GitHub
        </a>
        <Link href="/admin" className="flex min-h-11 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800">
          <LayoutDashboard aria-hidden="true" className="size-4" />
          Dashboard
        </Link>
      </TopBar>

      <main id="main" className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
        <div id="overview" className="grid scroll-mt-24 gap-5 xl:grid-cols-[2.3fr_1fr]">
          <section aria-labelledby="hero-h" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
            <p className={`inline-flex items-center gap-2 py-1 text-sm ${chip} bg-emerald-50 text-emerald-800 ring-emerald-200`}>
              <Scale aria-hidden="true" className="size-4 shrink-0" />
              UN SDG 8 · Decent work and economic growth
            </p>
            <h1 id="hero-h" className="mt-4 text-4xl font-semibold tracking-tight text-slate-950 sm:text-5xl">
              Every shift gets a receipt.
            </h1>
            <p lang="ta" className="mt-2 text-xl font-semibold text-emerald-800 sm:text-2xl">
              ஒவ்வொரு ஷிஃப்டுக்கும் ஒரு ரசீது.
            </p>
            <p className="mt-4 max-w-2xl text-lg text-slate-600">
              On construction sites and college campuses, the register belongs to the boss. FairShift makes the worker&apos;s phone a
              second register: their own copy of hours, pay math and every safety report, in their own language.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link href="/admin" className="flex min-h-12 items-center gap-2 rounded-xl bg-slate-950 px-5 font-semibold text-white hover:bg-slate-800">
                <LayoutDashboard aria-hidden="true" className="size-5" />
                Open the admin dashboard
              </Link>
              <a
                href="#workers"
                className="flex min-h-12 items-center gap-2 rounded-xl border border-slate-300 bg-white px-5 font-semibold text-slate-900 hover:bg-slate-50"
              >
                Try the worker app
                <ArrowRight aria-hidden="true" className="size-5" />
              </a>
            </div>
            <dl className="mt-8 grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
              <Kpi label="Overtime made visible" caption="This week, both sites" value={inr(otPaise)} note={`${otHours}h`} tone="amber" Icon={IndianRupee} />
              <Kpi label="Voice to hazard" caption="Tamil speech to a structured report" value="~2 s" note="Gemini" tone="indigo" Icon={Mic} />
              <Kpi
                label="Need rest"
                caption="Workers flagged, each with an action"
                value={`${crew.filter((c) => c.flagged).length}/${crew.length}`}
                note={`${crew.filter((c) => c.high).length} HIGH`}
                tone="red"
                Icon={HeartPulse}
              />
              <Kpi label="Industries" caption="One codebase, a rule pack each" value={String(Object.keys(packs).length)} note="config" tone="green" Icon={Factory} />
            </dl>
          </section>

          <Card
            id="receipt"
            title="Shift receipt"
            Icon={Receipt}
            aside={<span className={`${chip} bg-slate-100 text-slate-700 ring-slate-200`}>Last 7 days</span>}
          >
            <p className="text-lg font-semibold text-slate-950">
              {ravi.w.name} · {ravi.w.role}
            </p>
            <p className="text-sm text-slate-600">{raviPack.site}</p>
            <ul aria-label="Hours per night" className="mt-4 flex h-24 items-end gap-1.5">
              {ravi.pay.days.map((d) => (
                <li key={d.date} className="flex flex-1 flex-col overflow-hidden rounded-lg" style={{ height: `${(d.minutes / raviMax) * 100}%` }}>
                  <span className="sr-only">
                    {weekday(d.date)}: {hours(d.minutes)} hours
                  </span>
                  <span
                    aria-hidden="true"
                    className="bg-amber-400"
                    style={{ height: `${(Math.max(0, d.minutes - raviPack.dailyHours * 60) / d.minutes) * 100}%`, backgroundImage: stripes }}
                  />
                  <span aria-hidden="true" className="flex-1 bg-indigo-500" />
                </li>
              ))}
            </ul>
            <dl className="mt-4 space-y-1.5 text-sm tabular-nums">
              <div className="flex justify-between gap-3">
                <dt className="text-slate-700">
                  Regular {hours(ravi.pay.regularMinutes)}h × {rupees(ravi.pay.ratePaisePerHour)}
                </dt>
                <dd className="font-semibold text-slate-950">{rupees(ravi.pay.regularPaise)}</dd>
              </div>
              <div className="flex justify-between gap-3">
                <dt className="text-slate-700">
                  Overtime {hours(ravi.pay.otMinutes)}h × {raviPack.otMultiplier}
                </dt>
                <dd className="font-semibold text-slate-950">{rupees(ravi.pay.otPaise)}</dd>
              </div>
              <div className="flex justify-between gap-3 border-t-2 border-slate-950 pt-2 text-base font-semibold text-slate-950">
                <dt>Owed to Ravi</dt>
                <dd>{rupees(ravi.pay.totalPaise)}</dd>
              </div>
            </dl>
            <p className="mt-4 rounded-xl bg-amber-50 p-3 text-sm text-amber-950">
              A 12-hour night is worth two 8-hour days. The paper register pays one.
            </p>
            <p className="mt-3 flex items-center gap-2 text-sm font-semibold text-emerald-800">
              <Volume2 aria-hidden="true" className="size-4" />
              <span lang="ta">படித்துக் காட்டு</span> · read aloud in Tamil
            </p>
          </Card>
        </div>

        <Card id="problem" title="The problem is who holds the register" Icon={ClipboardList}>
          <ul className="grid gap-4 md:grid-cols-3">
            {problems.map(({ Icon, title, text }) => (
              <li key={title} className="rounded-2xl bg-slate-50 p-5">
                <Icon aria-hidden="true" className="size-6 text-slate-900" strokeWidth={1.75} />
                <h3 className="mt-3 text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-slate-700">{text}</p>
              </li>
            ))}
          </ul>
        </Card>

        <Card id="features" title="Four features, one idea" Icon={Sparkles}>
          <p className="-mt-2 mb-5 text-slate-600">Give the worker their own copy of the facts.</p>
          <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {features.map(({ Icon, title, sdg, text }) => (
              <li key={title} className="flex flex-col rounded-2xl border border-slate-200 p-5">
                <span className="w-fit rounded-xl bg-slate-100 p-2.5 text-slate-900">
                  <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 flex-1 text-slate-700">{text}</p>
                <span className={`mt-4 ${chip} bg-emerald-50 text-emerald-800 ring-emerald-200`}>{sdg}</span>
              </li>
            ))}
          </ul>
        </Card>

        <Card id="loop" title="The hazard loop closes on the worker's phone" Icon={Repeat}>
          <ol className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {loop.map(({ Icon, title, text }, i) => (
              <li key={title} className="rounded-2xl bg-slate-50 p-5">
                <span className="flex items-center gap-3">
                  <span className="flex size-9 items-center justify-center rounded-full bg-slate-950 font-semibold text-white">{i + 1}</span>
                  <Icon aria-hidden="true" className="size-6 text-slate-900" strokeWidth={1.75} />
                </span>
                <h3 className="mt-3 font-semibold text-slate-950">{title}</h3>
                <p className="mt-1 text-slate-700">{text}</p>
              </li>
            ))}
          </ol>
          <p className="mt-4 flex items-start gap-2 rounded-2xl bg-indigo-50 p-4 text-indigo-950">
            <BrainCircuit aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
            <span>
              <strong>AI listens, rules decide.</strong> Gemini only turns speech into structured data. Pay and alerts are plain,
              unit-tested functions; Gemini never touches a rupee and can never lower a hazard below its rule-pack severity floor.
            </span>
          </p>
        </Card>

        <Card id="workers" title="Try the worker app" Icon={Smartphone}>
          <p className="-mt-2 mb-5 text-slate-600">Built for low-end Android phones: big targets, Tamil first, voice in and out.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {Object.values(packs).map((p) => {
              const SiteIcon = siteIcon[p.id] ?? Factory;
              return (
                <section key={p.id} aria-labelledby={`${p.id}-h`} className="rounded-2xl bg-slate-50 p-4 sm:p-5">
                  <h3 id={`${p.id}-h`} className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <SiteIcon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
                    {p.industry}
                  </h3>
                  <p className="text-sm text-slate-600">{p.site}</p>
                  <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                    {crew
                      .filter((c) => c.w.packId === p.id)
                      .map(({ w, pay, flagged }) => {
                        const Icon = roleIcon[w.id] ?? HardHat;
                        return (
                          <li key={w.id}>
                            <Link
                              href={`/w/${w.id}`}
                              className="group flex h-full min-h-28 flex-col rounded-xl border border-slate-200 bg-white p-4 hover:border-slate-950"
                            >
                              <span className="flex items-center gap-2 font-semibold text-slate-950">
                                <Icon aria-hidden="true" className="size-5 shrink-0 text-slate-700" />
                                {w.name}
                                <ArrowRight aria-hidden="true" className="ml-auto size-5 text-slate-500 group-hover:text-slate-950" />
                              </span>
                              <span className="text-sm text-slate-600">{w.role}</span>
                              <span className="mt-3 text-2xl font-semibold tracking-tight text-slate-950">{inr(pay.totalPaise)}</span>
                              <span className="text-sm text-slate-600">owed for {hours(pay.totalMinutes)}h this week</span>
                              {flagged && (
                                <span className="mt-2 w-fit rounded-lg bg-red-700 px-2 py-0.5 text-xs font-bold text-white">
                                  <span aria-hidden="true">▲ </span>
                                  Needs rest
                                </span>
                              )}
                            </Link>
                          </li>
                        );
                      })}
                  </ul>
                </section>
              );
            })}
          </div>
        </Card>

        <Card id="packs" title="Cross-industry is config, not code" Icon={Factory}>
          <p className="-mt-2 mb-5 text-slate-600">Each site runs on a rule pack. Same app, different rules.</p>
          <div className="grid gap-4 md:grid-cols-3">
            {Object.values(packs).map((p) => {
              const Icon = siteIcon[p.id] ?? Factory;
              return (
                <div key={p.id} className="rounded-2xl bg-slate-50 p-5">
                  <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                    <Icon aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
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
              <h3 className="flex items-center gap-2 text-lg font-semibold text-slate-950">
                <Hospital aria-hidden="true" className="size-5 shrink-0" strokeWidth={1.75} />
                Hospital, factory…
              </h3>
              <p className="mt-2 text-slate-700">
                One more entry in <code className="rounded bg-slate-100 px-1">lib/rules.ts</code>: categories, severity floors, wage basis.
                No code changes.
              </p>
            </div>
          </div>
        </Card>
      </main>

      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-6 text-sm text-slate-600">
          <span>FairShift · Prompt Wars 2026 · demo data is fictional; rule packs are defaults, not legal advice.</span>
          <a href="https://github.com/Cpvasanth/fairshift" className="ml-auto font-semibold text-slate-900 underline underline-offset-2">
            Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
}
