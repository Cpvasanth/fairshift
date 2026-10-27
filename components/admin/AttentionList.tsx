import { ArrowRight, HeartPulse } from "lucide-react";
import Link from "next/link";
import Card from "@/components/Card";
import { LevelBadge } from "@/components/StatusBadge";
import type { CrewRow } from "@/lib/crew";

// Fatigue flags with the action to take: explainable conditions, not a risk score.
export default function AttentionList({ crew }: { crew: CrewRow[] }) {
  const rows = crew.flatMap(({ w, flags }) => flags.map((f) => ({ w, f })));
  return (
    <Card id="attention" title="Attention list" Icon={HeartPulse}>
      <ul className="space-y-3">
        {rows.length === 0 && <li className="text-slate-600">Nobody is over the limits this week.</li>}
        {rows.map(({ w, f }) => (
          <li key={`${w.id}-${f.kind}`} className="flex flex-wrap items-center gap-3 rounded-xl border border-slate-200 p-4">
            <LevelBadge level={f.level} />
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
        ))}
      </ul>
    </Card>
  );
}
