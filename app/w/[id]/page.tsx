import Link from "next/link";
import { notFound } from "next/navigation";
import HazardReporter from "@/components/HazardReporter";
import SpeakButton from "@/components/SpeakButton";
import { computeWeek, hours, rupees } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, workers } from "@/lib/seed";

export default async function WorkerPage({ params }: PageProps<"/w/[id]">) {
  const { id } = await params;
  const w = workers[id];
  if (!w) notFound();
  const pack = packs[w.packId];
  const r = computeWeek(recentShifts(w), pack, w.wagePaise);
  const maxMin = Math.max(...r.days.map((d) => d.minutes), pack.dailyHours * 60);
  const sayPay =
    `கடந்த 7 நாட்களில் நீங்கள் ${hours(r.totalMinutes)} மணி நேரம் வேலை செய்தீர்கள். ` +
    `அதில் ${hours(r.otMinutes)} மணி நேரம் கூடுதல் நேரம், இரட்டை ஊதியம். ` +
    `உங்களுக்கு சேர வேண்டியது ${Math.round(r.totalPaise / 100)} ரூபாய்.`;

  return (
    <main id="main" className="mx-auto w-full max-w-xl space-y-5 p-4">
      <Link href="/" className="underline">
        ← FairShift
      </Link>
      <header>
        <h1 className="text-2xl font-bold">
          {w.name} · {w.role}
        </h1>
        <p className="text-gray-700">
          {pack.site} · {pack.industry}
        </p>
      </header>

      <section aria-labelledby="pay-h" className="space-y-3 rounded-xl border-2 border-gray-300 p-4">
        <h2 id="pay-h" className="text-xl font-bold">
          <span lang="ta">என் ஊதிய ரசீது</span> · My pay receipt (last 7 days)
        </h2>
        <ul aria-label="Hours per day" className="space-y-1">
          {r.days.map((d) => {
            const reg = Math.min(d.minutes, pack.dailyHours * 60);
            return (
              <li key={d.date} className="flex items-center gap-2 text-sm">
                <span className="w-20 shrink-0">{d.date.slice(5)}</span>
                <span className="flex h-6 flex-1" aria-hidden="true">
                  <span className="bg-blue-800" style={{ width: `${(reg / maxMin) * 100}%` }} />
                  <span
                    className="bg-amber-500"
                    style={{
                      width: `${((d.minutes - reg) / maxMin) * 100}%`,
                      backgroundImage: "repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,.35) 4px 7px)",
                    }}
                  />
                </span>
                <span className="w-24 shrink-0 text-right">
                  {hours(d.minutes)}h{d.minutes > reg ? ` (+${hours(d.minutes - reg)} OT)` : ""}
                </span>
              </li>
            );
          })}
        </ul>
        <p className="text-sm text-gray-700">Solid blue = regular hours, striped amber = overtime.</p>
        <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-1">
          <dt>
            Regular {hours(r.regularMinutes)}h × {rupees(r.ratePaisePerHour)}
          </dt>
          <dd className="text-right">{rupees(r.regularPaise)}</dd>
          <dt>
            Overtime {hours(r.otMinutes)}h × {pack.otMultiplier} × {rupees(r.ratePaisePerHour)}
          </dt>
          <dd className="text-right">{rupees(r.otPaise)}</dd>
          <dt className="border-t-2 border-gray-900 pt-1 text-lg font-bold">Owed to you</dt>
          <dd className="border-t-2 border-gray-900 pt-1 text-right text-lg font-bold">{rupees(r.totalPaise)}</dd>
        </dl>
        <p className="text-sm">
          Rule: over {pack.dailyHours}h a day or {pack.weeklyHours}h a week is overtime, paid at {pack.otMultiplier}×. So a 12-hour
          shift is worth two 8-hour days.
        </p>
        <SpeakButton text={sayPay} label="Read aloud · படித்துக் காட்டு" />
      </section>

      <HazardReporter packId={pack.id} />
      <HazardReporter packId={pack.id} kind="voice" />
    </main>
  );
}
