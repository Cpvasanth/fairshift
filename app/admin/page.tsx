import Link from "next/link";
import HazardBoard from "@/components/HazardBoard";
import { flags } from "@/lib/fatigue";
import { computeWeek, hours, rupees } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, seededAt, workers } from "@/lib/seed";

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  const { site } = await searchParams;
  const pack = packs[typeof site === "string" ? site : ""] ?? packs.construction;
  const crew = Object.values(workers)
    .filter((w) => w.packId === pack.id)
    .map((w) => ({ w, pay: computeWeek(recentShifts(w), pack, w.wagePaise), flags: flags(w.shifts, seededAt) }));

  return (
    <main id="main" className="mx-auto w-full max-w-5xl space-y-6 p-4">
      <header className="flex flex-wrap items-center gap-4">
        <h1 className="text-2xl font-bold">FairShift admin</h1>
        <nav aria-label="Site" className="flex gap-2">
          {Object.values(packs).map((p) => (
            <Link
              key={p.id}
              href={`/admin?site=${p.id}`}
              aria-current={p.id === pack.id ? "page" : undefined}
              className={`min-h-12 rounded-lg border-2 border-gray-900 px-4 py-2 font-semibold ${p.id === pack.id ? "bg-gray-900 text-white" : ""}`}
            >
              {p.industry}
            </Link>
          ))}
        </nav>
      </header>
      <p className="text-gray-700">
        {pack.site}: overtime beyond {pack.dailyHours}h/day or {pack.weeklyHours}h/week at {pack.otMultiplier}×, {pack.wageBasis} wages.
      </p>

      <div className="grid gap-6 lg:grid-cols-2">
        <section aria-labelledby="hz-h" className="space-y-3">
          <h2 id="hz-h" className="text-xl font-bold">
            Live hazards
          </h2>
          <HazardBoard packId={pack.id} />
        </section>

        <div className="space-y-6">
          <section aria-labelledby="att-h" className="space-y-3">
            <h2 id="att-h" className="text-xl font-bold">
              Attention list
            </h2>
            <ul className="space-y-2">
              {crew.flatMap(({ w, flags }) =>
                flags.map((f) => (
                  <li key={w.id + f.action} className="rounded-xl border-2 border-gray-700 p-3">
                    <span className={`mr-2 rounded px-2 py-0.5 text-sm font-bold text-white ${f.level === "HIGH" ? "bg-red-800" : "bg-amber-800"}`}>
                      <span aria-hidden="true">{f.level === "HIGH" ? "▲ " : "● "}</span>
                      {f.level}
                    </span>
                    <strong>{w.name}</strong>: {f.text}. <strong>{f.action}.</strong>
                  </li>
                )),
              )}
            </ul>
          </section>

          <section aria-labelledby="wk-h" className="space-y-3">
            <h2 id="wk-h" className="text-xl font-bold">
              This week (last 7 days)
            </h2>
            <table className="w-full text-left">
              <thead>
                <tr className="border-b-2 border-gray-900">
                  <th scope="col" className="py-1">Worker</th>
                  <th scope="col">Hours</th>
                  <th scope="col">Overtime</th>
                  <th scope="col" className="text-right">Owed</th>
                </tr>
              </thead>
              <tbody>
                {crew.map(({ w, pay }) => (
                  <tr key={w.id} className="border-b border-gray-300">
                    <td className="py-2">
                      <Link href={`/w/${w.id}`} className="underline">
                        {w.name}
                      </Link>{" "}
                      <span className="text-gray-700">{w.role}</span>
                    </td>
                    <td>{hours(pay.totalMinutes)}h</td>
                    <td>{hours(pay.otMinutes)}h</td>
                    <td className="text-right">{rupees(pay.totalPaise)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>
      </div>
    </main>
  );
}
