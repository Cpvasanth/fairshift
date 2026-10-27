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

export const statusLabel: Record<Status, string> = {
  OPEN: "Open · திறந்துள்ளது",
  ACKNOWLEDGED: "Seen · பார்க்கப்பட்டது",
  FIXED: "Fixed · சரி செய்யப்பட்டது",
};

export function StatusBadge({ status }: { status: Status }) {
  const cls = status === "FIXED" ? "bg-green-800" : status === "ACKNOWLEDGED" ? "bg-blue-800" : "bg-gray-700";
  return <span className={`rounded px-2 py-0.5 text-sm font-semibold text-white ${cls}`}>{statusLabel[status]}</span>;
}
