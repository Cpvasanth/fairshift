import {
  ArrowRight,
  ChartColumnBig,
  Download,
  Gauge,
  Grid3x3,
  HeartPulse,
  IndianRupee,
  LayoutGrid,
  Receipt,
  Smartphone,
  Users,
} from "lucide-react";
import Link from "next/link";
import Kpi from "@/components/Kpi";
import { LiveProvider } from "@/components/live";
import { BellLink, FixTimeKpi, HazardTable, OpenHazardsKpi, ResolutionGauge, SealedList } from "@/components/LiveWidgets";
import { flags, type Flag } from "@/lib/fatigue";
import { computeWeek, dayKey, hours, rupees } from "@/lib/pay";
import { packs } from "@/lib/rules";
import { recentShifts, seededAt, workers } from "@/lib/seed";

const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
const weekday = (date: string) => new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });

// Heatmap scale: a cell's colour comes from that worker's hours that day. Text keeps 4.5:1 on every step.
const heat = (h: number) =>
  h === 0
    ? "bg-slate-100 text-slate-600"
    : h <= 8
      ? "bg-orange-100 text-orange-950"
      : h <= 10
        ? "bg-orange-300 text-orange-950"
        : h <= 12
          ? "bg-orange-500 text-slate-950"
          : "bg-orange-700 text-white";

function Card({ id, title, Icon, aside, children, className = "" }: {
  id: string;
  title: string;
  Icon: typeof Gauge;
  aside?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    // min-w-0: a grid item otherwise grows to its content's width and pushes the page sideways on phones.
    <section id={id} aria-labelledby={`${id}-h`} className={`min-w-0 scroll-mt-24 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6 ${className}`}>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <h2 id={`${id}-h`} className="flex items-center gap-2.5 text-xl font-semibold text-slate-950">
          <Icon aria-hidden="true" className="size-6" strokeWidth={1.75} />
          {title}
        </h2>
        {aside && <div className="ml-auto">{aside}</div>}
      </div>
      {children}
    </section>
  );
}

function FlagChip({ f }: { f: Flag }) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-lg px-2 py-0.5 text-xs leading-tight font-bold text-white ${f.level === "HIGH" ? "bg-red-700" : "bg-amber-800"}`}
    >
      <span aria-hidden="true">{f.level === "HIGH" ? "▲" : "●"}</span>
      <span className="sr-only">{f.level}: </span>
      {f.text}
    </span>
  );
}

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  const { site } = await searchParams;
  const pack = packs[typeof site === "string" ? site : ""] ?? packs.construction;
  const crew = Object.values(workers)
    .filter((w) => w.packId === pack.id)
    .map((w) => {
      const shifts = recentShifts(w);
      return { w, shifts, pay: computeWeek(shifts, pack, w.wagePaise), flags: flags(w.shifts, seededAt) };
    });

  // Per-day crew hours, with each worker's minutes beyond the daily limit counted as overtime.
  const days = [...new Set(crew.flatMap((c) => c.shifts.map((s) => dayKey(s.start))))].sort();
  const perDay = days.map((date) => {
    let total = 0;
    let ot = 0;
    for (const c of crew) {
      const m = c.pay.days.find((d) => d.date === date)?.minutes ?? 0;
      total += m;
      ot += Math.max(0, m - pack.dailyHours * 60);
    }
    return { date, total: hours(total), ot: hours(ot) };
  });
  const maxDay = Math.max(1, ...perDay.map((d) => d.total));
  // Every day that ties for the most hours is highlighted; the tooltip sits on the first of them.
  const peakDays = perDay.filter((d) => d.total === maxDay);

  const otPaise = crew.reduce((a, c) => a + c.pay.otPaise, 0);
  const otHours = hours(crew.reduce((a, c) => a + c.pay.otMinutes, 0));
  const flagged = crew.filter((c) => c.flags.length);
  const highFlags = crew.reduce((a, c) => a + c.flags.filter((f) => f.level === "HIGH").length, 0);
  const longest = crew.reduce((a, c) => (c.pay.totalMinutes > a.pay.totalMinutes ? c : a), crew[0]);

  const csv = [
    "Worker,Role,Site,Hours,Overtime hours,Rate per hour (Rs),Owed (Rs)",
    ...crew.map((c) =>
      [c.w.name, c.w.role, pack.site, hours(c.pay.totalMinutes), hours(c.pay.otMinutes), (c.pay.ratePaisePerHour / 100).toFixed(2), (c.pay.totalPaise / 100).toFixed(2)].join(","),
    ),
  ].join("\n");
  const csvHref = `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`;
  const csvName = `fairshift-${pack.id}-week.csv`;

  const nav = [
    { href: "#overview", label: "Dashboard", Icon: LayoutGrid, current: true },
    { href: "#hazards", label: "Hazards", Icon: Gauge },
    { href: "#crew", label: "Crew & pay", Icon: Users },
    { href: "#sealed", label: "Sealed Voice", Icon: HeartPulse },
  ];

  return (
    <LiveProvider packId={pack.id}>
      <div className="min-h-full bg-slate-100">
        <header className="sticky top-0 z-10 border-b border-slate-200 bg-white/95 backdrop-blur">
          <div className="mx-auto flex max-w-[1400px] flex-wrap items-center gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2 text-xl font-bold text-slate-950">
              <span className="flex size-9 items-center justify-center rounded-xl bg-emerald-700 text-white">
                <Receipt aria-hidden="true" className="size-5" />
              </span>
              FairShift
            </Link>
            {/* Phones: four equal columns, so no section is clipped off-screen. */}
            <nav aria-label="Dashboard sections" className="order-3 grid w-full grid-cols-4 gap-1 sm:flex lg:order-none lg:mx-auto lg:w-auto">
              {nav.map(({ href, label, Icon, current }) => (
                <a
                  key={href}
                  href={href}
                  aria-current={current ? "page" : undefined}
                  className={`flex min-h-11 items-center justify-center gap-2 rounded-xl px-1 text-center text-[13px] leading-tight font-semibold sm:px-4 sm:text-sm ${current ? "bg-slate-950 text-white" : "text-slate-700 hover:bg-slate-100"}`}
                >
                  <Icon aria-hidden="true" className="hidden size-4 sm:block" />
                  {label}
                </a>
              ))}
            </nav>
            <div className="ml-auto flex items-center gap-3 lg:ml-0">
              <BellLink />
              <span className="flex size-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-900">
                <span aria-hidden="true">SA</span>
                <span className="sr-only">Signed in as site admin</span>
              </span>
            </div>
          </div>
        </header>

        <main id="main" className="mx-auto max-w-[1400px] space-y-5 px-4 py-6">
          <div id="overview" className="grid scroll-mt-24 gap-5 xl:grid-cols-[2.3fr_1fr]">
            <section aria-labelledby="welcome-h" className="min-w-0 rounded-3xl border border-slate-200 bg-white p-4 sm:p-6">
              <div className="flex flex-wrap items-start gap-4">
                <div className="mr-auto max-w-2xl">
                  <h1 id="welcome-h" className="text-2xl font-semibold tracking-tight text-slate-950 sm:text-3xl">
                    Welcome back, site admin
                  </h1>
                  <p className="mt-2 text-slate-600">
                    Today at <strong className="font-semibold text-slate-900">{pack.site}</strong>: hazards, hours and pay, straight
                    from the workers&apos; own records. Overtime is {pack.otMultiplier}× beyond {pack.dailyHours}h a day or{" "}
                    {pack.weeklyHours}h a week.
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <nav aria-label="Site" className="flex rounded-xl bg-slate-100 p-1">
                    {Object.values(packs).map((p) => (
                      <Link
                        key={p.id}
                        href={`/admin?site=${p.id}`}
                        aria-current={p.id === pack.id ? "page" : undefined}
                        className={`flex min-h-10 items-center rounded-lg px-3 text-sm font-semibold ${p.id === pack.id ? "bg-white text-slate-950 shadow-sm" : "text-slate-700 hover:text-slate-950"}`}
                      >
                        {p.industry}
                      </Link>
                    ))}
                  </nav>
                  <a
                    href={csvHref}
                    download={csvName}
                    className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
                  >
                    Export pay
                    <Download aria-hidden="true" className="size-4" />
                  </a>
                </div>
              </div>
              <dl className="mt-8 grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                <OpenHazardsKpi />
                <FixTimeKpi />
                <Kpi
                  label="Overtime owed"
                  caption={`This week, paid at ${pack.otMultiplier}×`}
                  value={inr(otPaise)}
                  note={`${otHours}h`}
                  tone="amber"
                  Icon={IndianRupee}
                />
                <Kpi
                  label="Need rest"
                  caption="Workers over fatigue limits"
                  value={`${flagged.length}/${crew.length}`}
                  note={`${highFlags} HIGH`}
                  tone={highFlags ? "red" : "green"}
                  Icon={HeartPulse}
                />
              </dl>
            </section>

            <Card id="resolution" title="Hazard resolution" Icon={Gauge}>
              <ResolutionGauge />
            </Card>
          </div>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card id="hours" title="Crew hours this week" Icon={ChartColumnBig}>
              <ul className="sr-only">
                {perDay.map((d) => (
                  <li key={d.date}>
                    {weekday(d.date)} {d.date}: {d.total} hours, {d.ot} overtime
                  </li>
                ))}
              </ul>
              {/* pt-16 leaves room for the tooltip above the tallest bar. */}
              <div aria-hidden="true" className="flex h-72 items-end gap-1.5 pt-16 sm:gap-3">
                {perDay.map((d, i) => {
                  const isPeak = d.total === maxDay;
                  // Centred over its bar, but pinned to the card edge on the first and last bar so it never spills out.
                  const align = i === 0 ? "left-0" : i === perDay.length - 1 ? "right-0" : "left-1/2 -translate-x-1/2";
                  return (
                    <div key={d.date} className="relative flex-1" style={{ height: `${(d.total / maxDay) * 100}%` }}>
                      {d.date === peakDays[0]?.date && (
                        <>
                          <div className={`absolute bottom-full mb-2 whitespace-nowrap rounded-lg bg-slate-950 px-2.5 py-1 text-center text-white sm:px-3 ${align}`}>
                            <div className="text-[11px] text-slate-300">{peakDays.length > 1 ? `Peak, ${peakDays.length} days` : "Peak day"}</div>
                            <div className="text-base font-semibold leading-tight sm:text-lg">{d.total}h</div>
                          </div>
                          <span className="absolute bottom-full left-1/2 mb-1 size-2 -translate-x-1/2 rotate-45 bg-slate-950" />
                        </>
                      )}
                      <div className="flex h-full flex-col overflow-hidden rounded-lg sm:rounded-xl">
                        <div
                          className="bg-amber-400"
                          style={{
                            height: `${(d.ot / Math.max(d.total, 1)) * 100}%`,
                            backgroundImage: "repeating-linear-gradient(45deg, transparent 0 5px, rgba(0,0,0,.25) 5px 8px)",
                          }}
                        />
                        <div className={`flex-1 ${isPeak ? "bg-indigo-500" : "bg-indigo-200"}`} />
                      </div>
                    </div>
                  );
                })}
              </div>
              <div aria-hidden="true" className="mt-3 flex gap-1.5 sm:gap-3">
                {perDay.map((d) => (
                  <div key={d.date} className="flex-1 text-center">
                    <div className="text-sm font-medium text-slate-800 sm:text-base">{weekday(d.date)}</div>
                    <div className="text-xs text-slate-600">{d.total}h</div>
                  </div>
                ))}
              </div>
              <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm font-medium text-slate-700">
                <li className="flex items-center gap-2">
                  <span aria-hidden="true" className="size-3 rounded-sm bg-indigo-200" />
                  Regular hours
                </li>
                <li className="flex items-center gap-2">
                  <span
                    aria-hidden="true"
                    className="size-3 rounded-sm bg-amber-400"
                    style={{ backgroundImage: "repeating-linear-gradient(45deg, transparent 0 2px, rgba(0,0,0,.3) 2px 4px)" }}
                  />
                  Overtime beyond {pack.dailyHours}h per worker
                </li>
              </ul>
            </Card>

            <Card id="heat" title="Shift heatmap" Icon={Grid3x3}>
              {longest && (
                <p className="mb-5 flex flex-wrap items-baseline gap-2">
                  <span className="text-4xl font-semibold tracking-tight text-slate-950">{hours(longest.pay.totalMinutes)}h</span>
                  <span className="rounded-full bg-red-50 px-2 py-0.5 text-xs font-semibold text-red-800 ring-1 ring-red-200">
                    {hours(longest.pay.otMinutes)}h overtime
                  </span>
                  <span className="text-sm text-slate-600">longest week: {longest.w.name}</span>
                </p>
              )}
              {/* Fixed layout: seven equal day columns that fit a 390px phone without scrolling. */}
              <div className="overflow-x-auto">
                <table className="w-full min-w-[280px] table-fixed border-separate border-spacing-0.5 text-center sm:border-spacing-1">
                  <caption className="sr-only">Hours worked per worker per day, last 7 days</caption>
                  <thead>
                    <tr>
                      <th scope="col" className="w-[4.5rem] text-left text-xs font-medium text-slate-600 sm:w-24">
                        <span className="sr-only">Worker</span>
                      </th>
                      {days.map((d) => (
                        <th key={d} scope="col" className="text-xs font-medium text-slate-600">
                          {weekday(d)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {crew.map((c) => (
                      <tr key={c.w.id}>
                        <th scope="row" className="truncate pr-1 text-left text-sm font-semibold text-slate-900 sm:pr-2">
                          {c.w.name}
                        </th>
                        {days.map((d) => {
                          const h = hours(c.pay.days.find((x) => x.date === d)?.minutes ?? 0);
                          return (
                            <td key={d} className={`h-11 rounded-md text-xs font-semibold sm:h-14 sm:rounded-lg sm:text-sm ${heat(h)}`}>
                              {h ? `${h}h` : <span aria-label="no shift">–</span>}
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <ul className="mt-4 flex flex-wrap items-center gap-3 text-xs font-medium text-slate-700">
                {[
                  ["≤ 8h", "bg-orange-100"],
                  ["≤ 10h", "bg-orange-300"],
                  ["≤ 12h", "bg-orange-500"],
                  ["> 12h", "bg-orange-700"],
                ].map(([label, cls]) => (
                  <li key={label} className="flex items-center gap-1.5">
                    <span aria-hidden="true" className={`size-3 rounded-sm ring-1 ring-inset ring-black/20 ${cls}`} />
                    {label}
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          <Card id="hazards" title="Live hazards" Icon={Gauge}>
            <HazardTable />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <Card id="attention" title="Attention list" Icon={HeartPulse}>
              <ul className="space-y-3">
                {flagged.length === 0 && <li className="text-slate-600">Nobody is over the limits this week.</li>}
                {crew.flatMap(({ w, flags }) =>
                  flags.map((f) => (
                    <li key={w.id + f.action} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4">
                      <span
                        className={`rounded-lg px-2 py-1 text-xs font-bold text-white ${f.level === "HIGH" ? "bg-red-700" : "bg-amber-800"}`}
                      >
                        <span aria-hidden="true">{f.level === "HIGH" ? "▲ " : "● "}</span>
                        {f.level}
                      </span>
                      <span className="flex-1">
                        <Link href={`/w/${w.id}`} className="font-semibold text-slate-950 underline-offset-2 hover:underline">
                          {w.name}
                        </Link>{" "}
                        <span className="text-slate-600">· {f.text}</span>
                      </span>
                      <span className="flex items-center gap-1 text-sm font-semibold text-indigo-800">
                        <ArrowRight aria-hidden="true" className="size-4" />
                        {f.action}
                      </span>
                    </li>
                  )),
                )}
              </ul>
            </Card>

            <Card id="sealed" title="Sealed Voice" Icon={HeartPulse}>
              <p className="mb-4 text-sm text-slate-600">
                Feedback stays sealed until 5 workers here raise the same theme within 4 weeks. Only English summaries are shown,
                never who said it or how.
              </p>
              <SealedList />
            </Card>
          </div>

          <Card
            id="crew"
            title="Crew & pay this week"
            Icon={Users}
            aside={
              <a
                href={csvHref}
                download={csvName}
                className="flex min-h-10 items-center gap-2 rounded-xl bg-slate-950 px-4 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Export CSV
                <Download aria-hidden="true" className="size-4" />
              </a>
            }
          >
            {/* Priority columns: phones keep Worker (name links to the receipt) and Owed; hours and flags fold under the name. */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50 text-sm text-slate-700">
                    <th scope="col" className="rounded-l-lg px-3 py-3 font-semibold">Worker</th>
                    <th scope="col" className="hidden px-3 font-semibold md:table-cell">Hours</th>
                    <th scope="col" className="hidden px-3 font-semibold md:table-cell">Overtime</th>
                    <th scope="col" className="hidden px-3 font-semibold lg:table-cell">Rate</th>
                    <th scope="col" className="px-3 text-right font-semibold max-sm:rounded-r-lg">Owed</th>
                    <th scope="col" className="hidden px-3 font-semibold md:table-cell">Flags</th>
                    <th scope="col" className="hidden rounded-r-lg px-3 font-semibold sm:table-cell">
                      <span className="sr-only">Worker app</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {crew.map(({ w, pay, flags }) => {
                    const chips = flags.length ? flags.map((f) => <FlagChip key={f.action} f={f} />) : <span className="text-sm text-emerald-800">OK</span>;
                    return (
                      <tr key={w.id} className="border-b border-slate-100">
                        <td className="px-3 py-4">
                          <Link href={`/w/${w.id}`} className="font-semibold text-slate-950 underline-offset-2 hover:underline">
                            {w.name}
                          </Link>
                          <div className="text-sm text-slate-600">{w.role}</div>
                          <div className="mt-1 text-sm text-slate-800 md:hidden">
                            {hours(pay.totalMinutes)}h · {hours(pay.otMinutes)}h overtime
                          </div>
                          <div className="mt-2 flex flex-wrap gap-1 md:hidden">{chips}</div>
                        </td>
                        <td className="hidden px-3 text-slate-900 md:table-cell">{hours(pay.totalMinutes)}h</td>
                        <td className="hidden px-3 font-semibold text-slate-900 md:table-cell">{hours(pay.otMinutes)}h</td>
                        <td className="hidden px-3 text-sm whitespace-nowrap text-slate-700 lg:table-cell">{rupees(pay.ratePaisePerHour)}/h</td>
                        <td className="px-3 text-right font-semibold whitespace-nowrap text-slate-950">{rupees(pay.totalPaise)}</td>
                        <td className="hidden px-3 md:table-cell">
                          <div className="flex flex-wrap gap-1">{chips}</div>
                        </td>
                        <td className="hidden px-3 text-right sm:table-cell">
                          <Link
                            href={`/w/${w.id}`}
                            className="inline-flex min-h-10 items-center gap-1.5 rounded-lg border border-slate-300 px-3 text-sm font-semibold text-slate-900 hover:bg-slate-50"
                          >
                            <Smartphone aria-hidden="true" className="size-4" />
                            Receipt<span className="sr-only"> for {w.name}</span>
                          </Link>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </main>
      </div>
    </LiveProvider>
  );
}
