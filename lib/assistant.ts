import type { Flag } from "./fatigue";
import { ago, hours, rupees } from "./format";
import type { Week } from "./pay";
import type { Pack, Severity } from "./rules";
import type { Group } from "./sealed";
import type { Hazard } from "./store";

// The shift assistant: plain, tested rules turn each person's own context into their next step, and every step
// carries the rule behind it. Same principle as the rest of FairShift: AI listens, rules decide.

export type Urgency = "act" | "check" | "ok";
const urgencyRank: Record<Urgency, number> = { act: 0, check: 1, ok: 2 };

// --- Worker: what should I do about this week? (English + Tamil, so it can be read aloud) ---

export type Advice = { id: string; urgency: Urgency; en: string; ta: string; why: string };

function flagAdvice(f: Flag, pack: Pack): Advice {
  switch (f.kind) {
    case "streak":
      return {
        id: "streak",
        urgency: "act",
        en: `Ask for a day off. You have worked ${f.value} days in a row.`,
        ta: `ஓய்வு நாள் கேளுங்கள். நீங்கள் தொடர்ந்து ${f.value} நாட்கள் வேலை செய்துள்ளீர்கள்.`,
        why: "7 or more days without a rest day is flagged HIGH. Your site admin sees the same flag.",
      };
    case "hours":
      return {
        id: "hours",
        urgency: f.level === "HIGH" ? "act" : "check",
        en: `Ask for shorter shifts. You worked ${f.value}h in 7 days.`,
        ta: `குறைந்த நேர ஷிஃப்ட் கேளுங்கள். 7 நாட்களில் ${f.value} மணி நேரம் வேலை செய்தீர்கள்.`,
        why: `Over ${pack.weeklyHours}h a week is overtime; over 60h is flagged HIGH.`,
      };
    case "rest":
      return {
        id: "rest",
        urgency: "check",
        en: `Start later tomorrow. You had only ${f.value}h of rest between shifts.`,
        ta: `நாளை தாமதமாகத் தொடங்குங்கள். ஷிஃப்டுகளுக்கு இடையே ${f.value} மணி நேரம் மட்டுமே ஓய்வு.`,
        why: "At least 10 hours of rest between shifts.",
      };
  }
}

// Most urgent first: a missing rest day, then too many hours, short rest, then money to check.
export function workerAdvice(pay: Week, fl: Flag[], pack: Pack): Advice[] {
  const kinds: Flag["kind"][] = ["streak", "hours", "rest"];
  const out = kinds.flatMap((k) => fl.filter((f) => f.kind === k).map((f) => flagAdvice(f, pack)));
  if (pay.otMinutes > 0)
    out.push({
      id: "overtime",
      urgency: "check",
      en: `Check that your pay slip shows ${rupees(pay.otPaise)} of overtime for ${hours(pay.otMinutes)}h.`,
      ta: `${hours(pay.otMinutes)} மணி நேர கூடுதல் நேரத்திற்கு ${Math.round(pay.otPaise / 100)} ரூபாய் சேர வேண்டும். ஊதியச் சீட்டைச் சரிபாருங்கள்.`,
      why: `Over ${pack.dailyHours}h a day or ${pack.weeklyHours}h a week is paid at ${pack.otMultiplier}×.`,
    });
  if (out.length === 0)
    out.push({
      id: "ok",
      urgency: "ok",
      en: "Your week is within the rules. Nothing to do.",
      ta: "உங்கள் வாரம் விதிகளுக்குள் உள்ளது.",
      why: `No overtime, rest days taken, under ${pack.weeklyHours}h a week.`,
    });
  return out.sort((a, b) => urgencyRank[a.urgency] - urgencyRank[b.urgency]);
}

// --- Site admin: what should I do first? ---

export type Person = { id: string; name: string; flags: Flag[] };
export type Priority = { id: string; urgency: Urgency; title: string; why: string; href: string };

// Lower step = sooner. Safety before fatigue before feedback; within a step, the oldest problem first.
const hazardStep: Record<Severity, number> = { HIGH: 0, MEDIUM: 3, LOW: 6 };
const NEEDS_REVIEW = 1;
const HIGH_FLAG = 2;
const SEALED_THEME = 4;
const WARN_FLAG = 5;

export function adminPriorities(hazards: Hazard[], people: Person[], groups: Group[], now: number, limit = 4): Priority[] {
  const open = hazards.filter((h) => h.status !== "FIXED").sort((a, b) => a.createdAt - b.createdAt);
  const steps: (Priority & { step: number })[] = [
    ...open.map((h) => ({
      step: h.severity !== "HIGH" && h.needsReview ? NEEDS_REVIEW : hazardStep[h.severity],
      id: `hazard-${h.id}`,
      urgency: h.severity === "HIGH" ? ("act" as const) : ("check" as const),
      title: h.needsReview ? `Read the original report: ${h.category}` : `${h.status === "OPEN" ? "Acknowledge and fix" : "Fix"}: ${h.category}`,
      why: `${h.severity} hazard, reported ${ago(now - h.createdAt)} ago`,
      href: "#hazards",
    })),
    ...people.flatMap((p) =>
      p.flags.map((f) => ({
        step: f.level === "HIGH" ? HIGH_FLAG : WARN_FLAG,
        id: `flag-${p.id}-${f.kind}`,
        urgency: f.level === "HIGH" ? ("act" as const) : ("check" as const),
        title: `${f.action}: ${p.name}`,
        why: f.text,
        href: "#attention",
      })),
    ),
    ...groups.map((g) => ({
      step: SEALED_THEME,
      id: `sealed-${g.theme}`,
      urgency: "check" as const,
      title: `Respond to: ${g.theme}`,
      why: `${g.count} workers raised it through Sealed Voice`,
      href: "#sealed",
    })),
  ];
  // Array.prototype.sort is stable, so equal steps keep the oldest-first order built above.
  return steps
    .sort((a, b) => a.step - b.step)
    .slice(0, limit)
    .map(({ id, urgency, title, why, href }) => ({ id, urgency, title, why, href }));
}
