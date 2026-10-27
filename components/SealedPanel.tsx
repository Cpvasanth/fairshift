"use client";

import { useEffect, useState } from "react";

type Group = { packId: string; theme: string; count: number; summaries: string[] };

// The server only ever returns groups that reached 5, so a single report can never be seen or traced.
export default function SealedPanel({ packId }: { packId: string }) {
  const [groups, setGroups] = useState<Group[]>([]);

  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const res = await fetch("/api/hazards?sealed=1").catch(() => null);
      if (res?.ok) setGroups(await res.json());
    };
    tick();
    const t = setInterval(tick, 4000);
    return () => clearInterval(t);
  }, []);

  const list = groups.filter((g) => g.packId === packId);
  return (
    <div aria-live="polite" className="space-y-3">
      {list.length === 0 && <p className="text-gray-700">No theme has reached 5 workers yet. Everything stays sealed.</p>}
      {list.map((g) => (
        <article key={g.theme} className="rounded-xl border-2 border-purple-900 p-4">
          <h3 className="text-lg font-bold capitalize">
            <span aria-hidden="true">🔓 </span>
            {g.theme}: {g.count} workers
          </h3>
          <ul className="mt-2 list-disc space-y-1 pl-5">
            {g.summaries.map((s, i) => (
              <li key={i}>{s}</li>
            ))}
          </ul>
        </article>
      ))}
    </div>
  );
}
