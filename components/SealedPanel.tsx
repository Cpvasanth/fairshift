import { Lock, LockOpen } from "lucide-react";

export type Group = { packId: string; theme: string; count: number; summaries: string[] };

// The server only ever returns groups that reached 5, so a single report can never be seen or traced.
export default function SealedPanel({ groups }: { groups: Group[] }) {
  return (
    <div className="space-y-3">
      {groups.length === 0 && (
        <p className="flex items-center gap-2 rounded-xl bg-slate-100 p-4 text-slate-700">
          <Lock aria-hidden="true" className="size-5" />
          No theme has reached 5 workers yet. Everything stays sealed.
        </p>
      )}
      {groups.map((g) => (
        <article key={g.theme} className="rounded-xl border border-violet-300 bg-violet-50 p-4">
          <h3 className="flex items-center gap-2 font-bold capitalize text-violet-950">
            <LockOpen aria-hidden="true" className="size-5" />
            {g.theme}
            <span className="ml-auto rounded-full bg-violet-800 px-2.5 py-0.5 text-sm font-semibold normal-case text-white">
              {g.count} workers
            </span>
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-slate-800">
            {g.summaries.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
