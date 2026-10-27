import { ListChecks, Receipt, Scale, Users } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import Card from "@/components/Card";
import { BarLegend, DayBar } from "@/components/DayBar";
import HazardReporter from "@/components/HazardReporter";
import SpeakButton from "@/components/SpeakButton";
import { UrgencyBadge } from "@/components/StatusBadge";
import TopBar from "@/components/TopBar";
import { workerAdvice } from "@/lib/assistant";
import { workerWeek } from "@/lib/crew";
import { hours, inr, rupees, weekday } from "@/lib/format";
import { packs } from "@/lib/rules";
import { seededAt, workers } from "@/lib/seed";

const readAloud = (
  <>
    Read aloud · <span lang="ta">படித்துக் காட்டு</span>
  </>
);

export default async function WorkerPage({ params }: PageProps<"/w/[id]">) {
  const { id } = await params;
  const w = workers[id];
  if (!w) notFound();
  const pack = packs[w.packId];
  const { pay, flags } = workerWeek(w, pack, seededAt);
  const advice = workerAdvice(pay, flags, pack);
  const dayLimit = pack.dailyHours * 60;
  const max = Math.max(...pay.days.map((d) => d.minutes), dayLimit);
  const ot = (minutes: number) => Math.max(0, minutes - dayLimit);
  const sayPay =
    `கடந்த 7 நாட்களில் நீங்கள் ${hours(pay.totalMinutes)} மணி நேரம் வேலை செய்தீர்கள். ` +
    `அதில் ${hours(pay.otMinutes)} மணி நேரம் கூடுதல் நேரம், இரட்டை ஊதியம். ` +
    `உங்களுக்கு சேர வேண்டியது ${Math.round(pay.totalPaise / 100)} ரூபாய்.`;
  const stats = [
    { label: "Hours", note: "last 7 days", value: `${hours(pay.totalMinutes)}h` },
    { label: "Overtime", note: `paid at ${pack.otMultiplier}×`, value: `${hours(pay.otMinutes)}h` },
    { label: "Owed to you", note: "regular + overtime", value: inr(pay.totalPaise) },
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
        </section>

        <Card
          id="assistant"
          Icon={ListChecks}
          title={
            <>
              <span lang="ta">அடுத்து என்ன?</span> · What to do next
            </>
          }
        >
          <p className="-mt-2 mb-4 text-sm text-slate-600">Worked out from your own hours, pay and rest, under your site&apos;s rules.</p>
          <ol className="space-y-3">
            {advice.map((a) => (
              <li key={a.id} className="rounded-2xl border border-slate-200 p-4">
                <UrgencyBadge urgency={a.urgency} />
                <p className="mt-2 font-semibold text-slate-950">{a.en}</p>
                <p lang="ta" className="mt-1 text-slate-800">
                  {a.ta}
                </p>
                <p className="mt-2 text-sm text-slate-600">
                  <span className="font-semibold text-slate-700">Why: </span>
                  {a.why}
                </p>
              </li>
            ))}
          </ol>
          <div className="mt-4 empty:hidden">
            <SpeakButton text={advice.map((a) => a.ta).join(" ")}>{readAloud}</SpeakButton>
          </div>
        </Card>

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
            {pay.days.map((d) => (
              <li key={d.date}>
                {weekday(d.date)} {d.date}: {hours(d.minutes)} hours
                {ot(d.minutes) > 0 && `, ${hours(ot(d.minutes))} overtime`}
              </li>
            ))}
          </ul>
          <div aria-hidden="true" className="flex h-44 items-end gap-1.5 sm:gap-3">
            {pay.days.map((d) => (
              <DayBar key={d.date} minutes={d.minutes} otMinutes={ot(d.minutes)} max={max} />
            ))}
          </div>
          <div aria-hidden="true" className="mt-2 flex gap-1.5 sm:gap-3">
            {pay.days.map((d) => (
              <div key={d.date} className="flex-1 text-center">
                <div className="text-sm font-medium text-slate-800">{weekday(d.date)}</div>
                <div className="text-xs text-slate-600">{hours(d.minutes)}h</div>
                {ot(d.minutes) > 0 && <div className="text-xs font-semibold text-amber-900">+{hours(ot(d.minutes))} OT</div>}
              </div>
            ))}
          </div>
          <BarLegend regular="Regular hours" overtime="Overtime, striped" />

          <dl className="mt-5 divide-y divide-slate-200 rounded-2xl border border-slate-200 px-4 tabular-nums">
            <div className="flex justify-between gap-3 py-3">
              <dt className="text-slate-700">
                Regular {hours(pay.regularMinutes)}h × {rupees(pay.ratePaisePerHour)}
              </dt>
              <dd className="font-semibold whitespace-nowrap text-slate-950">{rupees(pay.regularPaise)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-3">
              <dt className="text-slate-700">
                Overtime {hours(pay.otMinutes)}h × {pack.otMultiplier} × {rupees(pay.ratePaisePerHour)}
              </dt>
              <dd className="font-semibold whitespace-nowrap text-slate-950">{rupees(pay.otPaise)}</dd>
            </div>
            <div className="flex justify-between gap-3 py-3 text-lg font-semibold text-slate-950">
              <dt>Owed to you</dt>
              <dd className="whitespace-nowrap">{rupees(pay.totalPaise)}</dd>
            </div>
          </dl>
          <p className="mt-4 flex gap-2 rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
            <Scale aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
            Rule: over {pack.dailyHours}h a day or {pack.weeklyHours}h a week is overtime, paid at {pack.otMultiplier}×. So a 12-hour
            shift is worth two 8-hour days.
          </p>
          <div className="mt-4 empty:hidden">
            <SpeakButton text={sayPay}>{readAloud}</SpeakButton>
          </div>
        </Card>

        <HazardReporter packId={pack.id} />
        <HazardReporter packId={pack.id} kind="voice" />
      </main>
    </div>
  );
}
