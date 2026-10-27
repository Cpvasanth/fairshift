import { Receipt, Scale, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import HazardReporter from "@/components/HazardReporter";
import SpeakButton from "@/components/SpeakButton";
import TopBar from "@/components/TopBar";
import { flags } from "@/lib/fatigue";
import { computeWeek, hours, inr, rupees, weekday } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, seededAt, workers } from "@/lib/seed";

const stripes = "repeating-linear-gradient(45deg, transparent 0 5px, rgba(0,0,0,.25) 5px 8px)";

export default async function WorkerPage({ params }: PageProps<"/w/[id]">) {
  const { id } = await params;
  const w = workers[id];
  if (!w) notFound();
  const pack = packs[w.packId];
  const r = computeWeek(recentShifts(w), pack, w.wagePaise);
  const rest = flags(w.shifts, seededAt);
  const dayLimit = pack.dailyHours * 60;
  const maxMin = Math.max(...r.days.map((d) => d.minutes), dayLimit);
  const sayPay =
    `கடந்த 7 நாட்களில் நீங்கள் ${hours(r.totalMinutes)} மணி நேரம் வேலை செய்தீர்கள். ` +
    `அதில் ${hours(r.otMinutes)} மணி நேரம் கூடுதல் நேரம், இரட்டை ஊதியம். ` +
    `உங்களுக்கு சேர வேண்டியது ${Math.round(r.totalPaise / 100)} ரூபாய்.`;
  const stats = [
    { label: "Hours", note: "last 7 days", value: `${hours(r.totalMinutes)}h` },
    { label: "Overtime", note: `paid at ${pack.otMultiplier}×`, value: `${hours(r.otMinutes)}h` },
    { label: "Owed to you", note: "regular + overtime", value: inr(r.totalPaise) },
  ];

  return (
    <div className="min-h-full bg-slate-100">
      <TopBar width="max-w-2xl">
        <Link
          href="/#workers"
          className="flex min-h-11 items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
        >
          <Users aria-hidden="true" className="size-4" />
          All workers
        </Link>
      </TopBar>

      <main id="main" className="mx-auto w-full max-w-2xl space-y-5 px-4 py-6">
        <section aria-labelledby="hello-h" className="rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
          <h1 id="hello-h" className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
            <span lang="ta">வணக்கம்</span>, {w.name}
          </h1>
          <p className="mt-1 text-slate-600">
            {w.role} · {pack.site} · {pack.industry}
          </p>
          <dl className="mt-6 grid grid-cols-3 divide-x divide-slate-200">
            {stats.map((s) => (
              <div key={s.label} className="flex flex-col justify-between gap-2 px-3 first:pl-0 last:pr-0 sm:px-5">
                <dt className="text-sm text-slate-600">
                  <span className="block font-semibold text-slate-900">{s.label}</span>
                  {s.note}
                </dt>
                <dd className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-4xl">{s.value}</dd>
              </div>
            ))}
          </dl>
          {/* The worker gets the same rest flags the admin sees: their own copy of the facts. */}
          {rest.length > 0 && (
            <ul aria-label="Rest check" className="mt-5 space-y-2">
              {rest.map((f) => (
                <li
                  key={f.action}
                  className={`flex flex-wrap items-center gap-x-3 gap-y-1 rounded-xl p-3 text-sm ring-1 ${f.level === "HIGH" ? "bg-red-50 text-red-950 ring-red-200" : "bg-amber-50 text-amber-950 ring-amber-200"}`}
                >
                  <span className={`rounded-lg px-2 py-0.5 text-xs font-bold text-white ${f.level === "HIGH" ? "bg-red-700" : "bg-amber-800"}`}>
                    <span aria-hidden="true">{f.level === "HIGH" ? "▲ " : "● "}</span>
                    {f.level}
                  </span>
                  <span className="font-semibold">{f.text}</span>
                  <span>Your site admin is asked to: {f.action.toLowerCase()}</span>
                </li>
              ))}
            </ul>
          )}
        </section>

        <Card
          id="pay"
          Icon={Receipt}
          title={
            <>
              <span lang="ta">என் ஊதிய ரசீது</span> · My pay receipt
            </>
          }
          aside={<span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-semibold text-slate-700">Last 7 days</span>}
        >
          <ul className="sr-only">
            {r.days.map((d) => (
              <li key={d.date}>
                {weekday(d.date)} {d.date}: {hours(d.minutes)} hours
                {d.minutes > dayLimit && `, ${hours(d.minutes - dayLimit)} overtime`}
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="flex h-44 items-end gap-1.5 sm:gap-3">
            {r.days.map((d) => (
              <div key={d.date} className="flex flex-1 flex-col overflow-hidden rounded-lg sm:rounded-xl" style={{ height: `${(d.minutes / maxMin) * 100}%` }}>
                <div className="bg-amber-400" style={{ height: `${(Math.max(0, d.minutes - dayLimit) / d.minutes) * 100}%`, backgroundImage: stripes }} />
                <div className="flex-1 bg-indigo-500" />
              </div>
            ))}
          </div>
          <div aria-hidden="true" className="mt-2 flex gap-1.5 sm:gap-3">
            {r.days.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                <div className="text-sm font-medium text-slate-800">{weekday(d.date)}</div>
                <div className="text-xs text-slate-600">{hours(d.minutes)}h</div>
                {d.minutes > dayLimit && <div className="text-xs font-semibold text-amber-900">+{hours(d.minutes - dayLimit)} OT</div>}
              </div>
            ))}
          </div>
          <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-sm bg-indigo-500" />
              Regular hours
            </li>
            <li className="flex items-center gap-2">
              <span aria-hidden="true" className="size-3 rounded-sm bg-amber-400" style={{ backgroundImage: stripes }} />
              Overtime, striped
            </li>
          </ul>

          <dl className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-4 tabular-nums">
            <div className="flex justify-between gap-3 py-3">
              <dt className="text-slate-700">
                Regular {hours(r.regularMinutes)}h × {rupees(r.ratePaisePerHour)}
              </dt>
              <dd className="font-semibold whitespace-nowrap text-slate-950">{rupees(r.regularPaise)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-3">
              <dt className="text-slate-700">
                Overtime {hours(r.otMinutes)}h × {pack.otMultiplier} × {rupees(r.ratePaisePerHour)}
              </dt>
              <dd className="font-semibold whitespace-nowrap text-slate-950">{rupees(r.otPaise)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-3 text-lg font-semibold text-slate-950">
              <dt>Owed to you</dt>
              <dd className="whitespace-nowrap">{rupees(r.totalPaise)}</dd>
            </div>
          </dl>
          <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <Scale aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Rule: over {pack.dailyHours}h a day or {pack.weeklyHours}h a week is overtime, paid at {pack.otMultiplier}×. So a 12-hour
            shift is worth two 8-hour days.
          </p>
          <div className="mt-4 empty:hidden">
            <SpeakButton text={sayPay}>
              Read aloud · <span lang="ta">படித்துக் காட்டு</span>
            </SpeakButton>
          </div>
        </Card>

        <HazardReporter packId={pack.id} />
        <HazardReporter packId={pack.id} kind="voice" />
      </main>
    </div>
  );
}
