import { Gauge, HeartPulse, IndianRupee, LayoutGrid, ListOrdered, LockKeyhole, Users } from "lucide-react";
import Link from "next/link";
import AttentionList from "@/components/admin/AttentionList";
import CrewHoursChart from "@/components/admin/CrewHoursChart";
import CrewPayTable, { ExportLink } from "@/components/admin/CrewPayTable";
import ShiftHeatmap from "@/components/admin/ShiftHeatmap";
import Card from "@/components/Card";
import Kpi from "@/components/Kpi";
import { LiveProvider } from "@/components/live";
import { BellLink, FixTimeKpi, HazardTable, OpenHazardsKpi, PriorityList, ResolutionGauge, SealedList } from "@/components/LiveWidgets";
import TopBar, { type NavItem } from "@/components/TopBar";
import { payCsv, siteWeek } from "@/lib/crew";
import { hours, inr } from "@/lib/format";
import { packs } from "@/lib/rules";
import { seededAt, workers } from "@/lib/seed";

const nav: NavItem[] = [
  { href: "#overview", label: "Dashboard", Icon: LayoutGrid, current: true },
  { href: "#hazards", label: "Hazards", Icon: Gauge },
  { href: "#crew", label: "Crew & pay", Icon: Users },
  { href: "#sealed", label: "Sealed Voice", Icon: LockKeyhole },
];

export default async function Admin({ searchParams }: PageProps<"/admin">) {
  const { site } = await searchParams;
  const pack = packs[typeof site === "string" ? site : ""] ?? packs.construction;
  const week = siteWeek(Object.values(workers), pack, seededAt);
  const csv = { href: `data:text/csv;charset=utf-8,${encodeURIComponent(payCsv(week.crew, pack))}`, name: `fairshift-${pack.id}-week.csv` };
  const people = week.crew.map(({ w, flags }) => ({ id: w.id, name: w.name, flags }));

  return (
    <LiveProvider packId={pack.id}>
      <div className="min-h-full bg-slate-100">
        <TopBar nav={nav} navLabel="Dashboard sections">
          <BellLink />
          <span className="flex size-11 items-center justify-center rounded-full bg-indigo-100 font-bold text-indigo-900">
            <span aria-hidden="true">SA</span>
            <span className="sr-only">Signed in as site admin</span>
          </span>
        </TopBar>

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
                  <ExportLink csv={csv} label="Export pay" />
                </div>
              </div>
              <dl className="mt-8 grid divide-y divide-slate-200 sm:grid-cols-2 sm:divide-y-0 lg:grid-cols-4 lg:divide-x">
                <OpenHazardsKpi />
                <FixTimeKpi />
                <Kpi
                  label="Overtime owed"
                  caption={`This week, paid at ${pack.otMultiplier}×`}
                  value={inr(week.otPaise)}
                  note={`${hours(week.otMinutes)}h`}
                  tone="amber"
                  Icon={IndianRupee}
                />
                <Kpi
                  label="Need rest"
                  caption="Workers over fatigue limits"
                  value={`${week.flagged}/${week.crew.length}`}
                  note={`${week.highFlags} HIGH`}
                  tone={week.highFlags ? "red" : "green"}
                  Icon={HeartPulse}
                />
              </dl>
            </section>

            <Card id="resolution" title="Hazard resolution" Icon={Gauge}>
              <ResolutionGauge />
            </Card>
          </div>

          <Card id="priorities" title="Do this first" Icon={ListOrdered}>
            <PriorityList people={people} />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <CrewHoursChart perDay={week.perDay} dailyHours={pack.dailyHours} />
            <ShiftHeatmap crew={week.crew} dates={week.dates} longest={week.longest} />
          </div>

          <Card id="hazards" title="Live hazards" Icon={Gauge}>
            <HazardTable />
          </Card>

          <div className="grid gap-5 lg:grid-cols-2">
            <AttentionList crew={week.crew} />
            <Card id="sealed" title="Sealed Voice" Icon={LockKeyhole}>
              <p className="mb-4 text-sm text-slate-600">
                Feedback stays sealed until 5 workers here raise the same theme within 4 weeks. Only English summaries are shown,
                never who said it or how.
              </p>
              <SealedList />
            </Card>
          </div>

          <CrewPayTable crew={week.crew} csv={csv} />
        </main>
      </div>
    </LiveProvider>
  );
}
