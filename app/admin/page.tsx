import { ArrowRight, GraduationCap, HardHat, ShieldCheck } from "lucide-react";
import Link from "next/link";
import LiveDashboard, { type ServerStat } from "@/components/LiveDashboard";
import { flags, type Flag } from "@/lib/fatigue";
import { computeWeek, hours, rupees } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, seededAt, workers } from "@/lib/seed";

const siteIcon = { construction: HardHat, college: GraduationCap } as Record<string, typeof HardHat>;

function FlagChip({ f, detail = false }: { f: Flag; detail?: boolean }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold text-white ${f.level === "HIGH" ? "bg-red-700" : "bg-amber-800"}`}
    >
      <span aria-hidden="true">{f.level === "HIGH" ? "▲" : "●"}</span>
      {detail ? <><span className="sr-only">{f.level}: </span>{f.text}</> : f.level}
    </span>
  );
}

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  const { site } = await searchParams;
  const pack = packs[typeof site === "string" ? site : ""] ?? packs.construction;
  const crew = Object.values(workers)
    .filter((w) => w.packId === pack.id)
    .map((w) => ({ w, pay: computeWeek(recentShifts(w), pack, w.wagePaise), flags: flags(w.shifts, seededAt) }));
  const otPaise = crew.reduce((a, c) => a + c.pay.otPaise, 0);
  const otMinutes = crew.reduce((a, c) => a + c.pay.otMinutes, 0);
  const flagged = crew.filter((c) => c.flags.length).length;
  const scaleH = Math.max(72, ...crew.map((c) => hours(c.pay.totalMinutes)));

  const stats: ServerStat[] = [
    {
      label: "Overtime owed this week",
      value: rupees(otPaise).replace(/\.\d+$/, ""),
      hint: `${hours(otMinutes)}h at ${pack.otMultiplier}×, lost on a paper register`,
      icon: "rupee",
      tone: "amber",
    },
    {
      label: "Need attention",
      value: `${flagged} of ${crew.length}`,
      hint: "Fatigue rules, each with an action",
      icon: "users",
      tone: flagged ? "red" : "emerald",
    },
  ];

  const attention = (
    <ul className="space-y-3">
      {crew.every((c) => !c.flags.length) && <li className="text-slate-600">Nobody is over the limits this week.</li>}
      {crew.flatMap(({ w, flags }) =>
        flags.map((f) => (
          <li key={w.id + f.action} className="rounded-xl border border-slate-200 p-3">
            <div className="flex flex-wrap items-center gap-2">
              <FlagChip f={f} />
              <Link href={`/w/${w.id}`} className="font-bold text-slate-900 underline-offset-2 hover:underline">
                {w.name}
              </Link>
              <span className="text-slate-600">{w.role}</span>
            </div>
            <p className="mt-1 text-slate-800">{f.text}.</p>
            <p className="mt-1 flex items-center gap-1 font-semibold text-indigo-800">
              <ArrowRight aria-hidden="true" className="size-4" />
              {f.action}
            </p>
          </li>
        )),
      )}
    </ul>
  );

  const crewTable = (
    <>
      <p className="mb-4 text-sm text-slate-600">
        Hours in the last 7 days. Solid indigo is regular time, striped amber is overtime at {pack.otMultiplier}×. The dashed line
        is the {pack.weeklyHours}h legal week.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[640px] text-left">
          <thead>
            <tr className="border-b-2 border-slate-900 text-sm text-slate-700">
              <th scope="col" className="py-2 pr-3">Worker</th>
              <th scope="col" className="w-1/2 pr-3">Hours</th>
              <th scope="col" className="pr-3">Overtime</th>
              <th scope="col" className="pr-3 text-right">Owed</th>
              <th scope="col">Flags</th>
            </tr>
          </thead>
          <tbody>
            {crew.map(({ w, pay, flags }) => (
              <tr key={w.id} className="border-b border-slate-200">
                <td className="py-3 pr-3">
                  <Link href={`/w/${w.id}`} className="font-semibold text-slate-900 underline underline-offset-2">
                    {w.name}
                  </Link>
                  <div className="text-sm text-slate-600">{w.role}</div>
                </td>
                <td className="pr-3">
                  <div className="relative flex h-6 overflow-hidden rounded-md bg-slate-100" aria-hidden="true">
                    <span className="bg-indigo-700" style={{ width: `${(hours(pay.regularMinutes) / scaleH) * 100}%` }} />
                    <span
                      className="bg-amber-500"
                      style={{
                        width: `${(hours(pay.otMinutes) / scaleH) * 100}%`,
                        backgroundImage: "repeating-linear-gradient(45deg, transparent 0 4px, rgba(0,0,0,.35) 4px 7px)",
                      }}
                    />
                    <span
                      className="absolute inset-y-0 border-l-2 border-dashed border-slate-900"
                      style={{ left: `${(pack.weeklyHours / scaleH) * 100}%` }}
                    />
                  </div>
                  <div className="mt-1 text-sm text-slate-700">{hours(pay.totalMinutes)}h worked</div>
                </td>
                <td className="pr-3 font-semibold">{hours(pay.otMinutes)}h</td>
                <td className="pr-3 text-right font-semibold">{rupees(pay.totalPaise)}</td>
                <td>
                  <div className="flex flex-wrap gap-1">
                    {flags.length ? flags.map((f) => <FlagChip key={f.action} f={f} detail />) : <span className="text-sm text-slate-600">None</span>}
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );

  return (
    <div className="min-h-full bg-slate-50">
      <header className="bg-gradient-to-r from-slate-900 via-slate-900 to-indigo-950 text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-4 px-4 py-6">
          <div className="mr-auto">
            <p className="flex items-center gap-2 text-sm font-semibold uppercase tracking-wider text-indigo-200">
              <ShieldCheck aria-hidden="true" className="size-4" />
              FairShift admin · every shift gets a receipt
            </p>
            <h1 className="mt-1 text-3xl font-bold">{pack.site}</h1>
            <p className="mt-1 text-slate-300">
              {pack.industry} · {pack.wageBasis} wages · overtime {pack.otMultiplier}× beyond {pack.dailyHours}h/day or{" "}
              {pack.weeklyHours}h/week
            </p>
          </div>
          <nav aria-label="Site" className="flex gap-1 rounded-xl bg-slate-800 p-1">
            {Object.values(packs).map((p) => {
              const Icon = siteIcon[p.id] ?? HardHat;
              const active = p.id === pack.id;
              return (
                <Link
                  key={p.id}
                  href={`/admin?site=${p.id}`}
                  aria-current={active ? "page" : undefined}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-4 font-semibold ${active ? "bg-white text-slate-900" : "text-slate-200 hover:bg-slate-700"}`}
                >
                  <Icon aria-hidden="true" className="size-5" />
                  {p.industry}
                </Link>
              );
            })}
          </nav>
          <span className="rounded-full border border-indigo-300 px-3 py-1 text-sm font-semibold text-indigo-100">
            UN SDG 8 · Decent work
          </span>
        </div>
      </header>
      <main id="main" className="mx-auto max-w-7xl px-4 py-6">
        <LiveDashboard packId={pack.id} stats={stats} attention={attention} crew={crewTable} />
      </main>
    </div>
  );
}
