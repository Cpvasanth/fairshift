import { Check, CircleDot, Eye } from "lucide-react";
import type { Urgency } from "@/lib/assistant";
import type { Severity } from "@/lib/rules";
import type { Status } from "@/lib/store";

// Icon + word + color, never color alone.
const sev: Record<Severity, [string, string]> = {
  HIGH: ["▲", "bg-red-100 text-red-900 border-red-800"],
  MEDIUM: ["●", "bg-amber-100 text-amber-900 border-amber-800"],
  LOW: ["▼", "bg-green-100 text-green-900 border-green-800"],
};

export function SeverityBadge({ severity }: { severity: Severity }) {
  const [icon, cls] = sev[severity];
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 text-sm font-bold ${cls}`}>
      <span aria-hidden="true">{icon}</span>
      {severity}
    </span>
  );
}

// Pill with icon, English word and Tamil word (marked lang="ta"), matching the admin board's chips.
const status: Record<Status, { en: string; ta: string; cls: string; Icon: typeof Check }> = {
  OPEN: { en: "Open", ta: "திறந்துள்ளது", cls: "bg-red-50 text-red-800 ring-red-200", Icon: CircleDot },
  ACKNOWLEDGED: { en: "Seen", ta: "பார்க்கப்பட்டது", cls: "bg-indigo-50 text-indigo-800 ring-indigo-200", Icon: Eye },
  FIXED: { en: "Fixed", ta: "சரி செய்யப்பட்டது", cls: "bg-emerald-50 text-emerald-800 ring-emerald-200", Icon: Check },
};

export function StatusBadge({ status: s }: { status: Status }) {
  const { en, ta, cls, Icon } = status[s];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-sm font-semibold ring-1 ${cls}`}>
      <Icon aria-hidden="true" className="size-4" />
      {en} · <span lang="ta">{ta}</span>
    </span>
  );
}

// Solid badge for fatigue flags and assistant steps. With a custom label, the level is still announced.
const solid = { HIGH: ["▲", "bg-red-700"], WARN: ["●", "bg-amber-800"], OK: ["✓", "bg-emerald-700"] } as const;

export function LevelBadge({ level, label = level }: { level: keyof typeof solid; label?: string }) {
  const [icon, bg] = solid[level];
  return (
    <span className={`inline-flex w-fit shrink-0 items-center gap-1 rounded-lg px-2 py-0.5 text-xs leading-tight font-bold text-white ${bg}`}>
      <span aria-hidden="true">{icon}</span>
      {label !== level && <span className="sr-only">{level}: </span>}
      {label}
    </span>
  );
}

const urgency = { act: ["HIGH", "Act now"], check: ["WARN", "Check"], ok: ["OK", "All good"] } as const;

export function UrgencyBadge({ urgency: u }: { urgency: Urgency }) {
  const [level, label] = urgency[u];
  return <LevelBadge level={level} label={label} />;
}
