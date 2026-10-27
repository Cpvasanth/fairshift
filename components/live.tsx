"use client";

import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Board } from "@/lib/api";
import type { Group } from "@/lib/sealed";
import type { Hazard, Status } from "@/lib/store";

type Live = {
  hazards: Hazard[];
  groups: Group[];
  now: number | null;
  setStatus: (id: string, status: Status) => void;
};

const LiveContext = createContext<Live | null>(null);

export function useLive() {
  const live = useContext(LiveContext);
  if (!live) throw new Error("useLive must be used inside <LiveProvider>");
  return live;
}

// One poller for the whole admin page: every 4s, 204 when unchanged, paused while the tab is hidden.
// Widgets anywhere in the server-rendered layout read the current site's slice through useLive().
export function LiveProvider({ packId, children }: { packId: string; children: ReactNode }) {
  const [hazards, setHazards] = useState<Hazard[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [now, setNow] = useState<number | null>(null);
  const version = useRef("");

  useEffect(() => {
    const tick = async () => {
      if (document.hidden) return;
      const res = await fetch(`/api/hazards?v=${version.current}`).catch(() => null);
      if (res?.status === 200) {
        const board: Board = await res.json();
        version.current = String(board.version);
        setHazards(board.hazards);
        const sealed = await fetch("/api/hazards?sealed=1").catch(() => null);
        if (sealed?.ok) {
          const unlocked: Group[] = await sealed.json();
          setGroups(unlocked);
        }
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
        h.id === id ? { ...h, status, ackAt: h.ackAt ?? t, fixedAt: status === "FIXED" ? (h.fixedAt ?? t) : h.fixedAt } : h,
      ),
    );
    await fetch("/api/hazards", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, status }),
    }).catch(() => null);
  }

  const value: Live = {
    hazards: hazards.filter((h) => h.packId === packId),
    groups: groups.filter((g) => g.packId === packId),
    now,
    setStatus,
  };
  return <LiveContext.Provider value={value}>{children}</LiveContext.Provider>;
}
