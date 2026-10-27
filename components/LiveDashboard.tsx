"use client";

import { IndianRupee, LockOpen, Radio, Timer, TriangleAlert, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import type { Hazard, Status } from "@/lib/store";
import HazardBoard, { ago } from "./HazardBoard";
import SealedPanel, { type Group } from "./SealedPanel";

const icons = { rupee: IndianRupee, users: Users };
export type ServerStat = { label: string; value: string; hint: string; icon: keyof typeof icons; tone: Tone };
type Tone = "red" | "amber" | "emerald" | "indigo" | "violet";
const toneCls: Record<Tone, string> = {
  red: "bg-red-100 text-red-800",
  amber: "bg-amber-100 text-amber-900",
  emerald: "bg-emerald-100 text-emerald-800",
  indigo: "bg-indigo-100 text-indigo-800",
  violet: "bg-violet-100 text-violet-800",
};

function Stat({ label, value, hint, Icon, tone }: { label: string; value: string; hint: string; Icon: typeof Users; tone: Tone }) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
      <dt className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className={`rounded-lg p-1.5 ${toneCls[tone]}`}>
          <Icon aria-hidden="true" className="size-5" />
        </span>
        {label}
      </dt>
      <dd className="mt-2 text-3xl font-bold tracking-tight text-slate-900">{value}</dd>
      <dd className="mt-1 text-sm text-slate-600">{hint}</dd>
    </div>
  );
}

function Panel({ id, title, aside, children }: { id: string; title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section aria-labelledby={id} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <h2 id={id} className="text-xl font-bold text-slate-900">
          {title}
        </h2>
        {aside}
      </div>
      {children}
    </section>
  );
}

// One poller for the whole admin view: every 4s, 204 when unchanged, paused while the tab is hidden.
export default function LiveDashboard({
  packId,
  stats,
  attention,
  crew,
}: {
  packId: string;
  stats: ServerStat[];
  attention: ReactNode;
  crew: ReactNode;
}) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const version = useRef("");

  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/hazards?v=${version.current}`).catch(() => null);
      if (res?.status === 200) {
        const data = await res.json();
        version.current = String(data.version);
        setHazards(data.hazards);
        const sealed = await fetch("/api/hazards?sealed=1").catch(() => null);
        if (sealed?.ok) setGroups(await sealed.json());
      }
      setNow(Date.now());
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, []);

  async function setStatus(id: string, status: Status) {
    const t = Date.now();
    setHazards((hs) =>
      hs.map((h) =>
        h.id === id
          ? { ...h, status, ackAt: h.ackAt ?? t, fixedAt: status === "FIXED" ? (h.fixedAt ?? t) : h.fixedAt }
          : h,
      ),
    );
    await fetch("/api/hazards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
  }

  const site = hazards.filter((h) => h.packId === packId);
  const open = site.filter((h) => h.status !== "FIXED");
  const highOpen = open.filter((h) => h.severity === "HIGH").length;
  const fixed = site.filter((h) => h.fixedAt);
  const avgFix = fixed.length ? fixed.reduce((a, h) => a + (h.fixedAt! - h.createdAt), 0) / fixed.length : null;
  const unlocked = groups.filter((g) => g.packId === packId);

  return (
    <div className="space-y-6">
      <section aria-label="Key figures">
        <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
          <Stat
            label="Open hazards"
            value={now === null ? "…" : String(open.length)}
            hint={highOpen ? `${highOpen} HIGH severity, act now` : "No HIGH severity open"}
            Icon={TriangleAlert}
            tone={highOpen ? "red" : "emerald"}
          />
          <Stat
            label="Average time to fix"
            value={avgFix === null ? "–" : ago(avgFix)}
            hint={`${fixed.length} fixed, every reporter told in Tamil`}
            Icon={Timer}
            tone="indigo"
          />
          {stats.map((s) => (
            <Stat key={s.label} label={s.label} value={s.value} hint={s.hint} Icon={icons[s.icon]} tone={s.tone} />
          ))}
          <Stat
            label="Sealed Voice"
            value={`${unlocked.length} unlocked`}
            hint="Themes raised by 5+ workers"
            Icon={LockOpen}
            tone="violet"
          />
        </dl>
      </section>

      <div className="grid gap-6 xl:grid-cols-5">
        <div className="xl:col-span-3">
          <Panel
            id="hz-h"
            title="Live hazards"
            aside={
              <span className="ml-auto flex items-center gap-1.5 text-sm text-slate-600">
                <Radio aria-hidden="true" className="size-4 text-emerald-700 motion-safe:animate-pulse" />
                Live{now !== null && ` · updated ${new Date(now).toLocaleTimeString("en-IN", { timeZone: "Asia/Kolkata" })}`}
              </span>
            }
          >
            <HazardBoard hazards={site} now={now ?? 0} onStatus={setStatus} />
          </Panel>
        </div>
        <div className="space-y-6 xl:col-span-2">
          <Panel id="att-h" title="Attention list">
            {attention}
          </Panel>
          <Panel id="sv-h" title="Sealed Voice">
            <p className="mb-3 text-sm text-slate-600">
              Feedback stays sealed until 5 workers here raise the same theme within 4 weeks. Only English summaries are shown,
              never who said it or how.
            </p>
            <SealedPanel groups={unlocked} />
          </Panel>
        </div>
      </div>

      <Panel id="crew-h" title="Crew this week">
        {crew}
      </Panel>
    </div>
  );
}
