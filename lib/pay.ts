import type { Pack } from "./rules";

export type Shift = { start: number; minutes: number }; // start = epoch ms

const IST = 5.5 * 3_600_000;
// A shift counts to the Asia/Kolkata date it started on (night shifts included).
export const dayKey = (t: number) => new Date(t + IST).toISOString().slice(0, 10);

// Integer minutes and integer paise; no floats until display.
export function computeWeek(shifts: Shift[], pack: Pack, wagePaise: number) {
  const perDay = new Map<string, number>();
  for (const s of shifts) perDay.set(dayKey(s.start), (perDay.get(dayKey(s.start)) ?? 0) + s.minutes);
  const mins = [...perDay.values()];
  const totalMinutes = mins.reduce((a, m) => a + m, 0);
  const dailyOt = mins.reduce((a, m) => a + Math.max(0, m - pack.dailyHours * 60), 0);
  const otMinutes = Math.max(dailyOt, totalMinutes - pack.weeklyHours * 60, 0);
  const regularMinutes = totalMinutes - otMinutes;
  // Hourly rate: daily wage / 8h, or monthly wage / (26 days x 8h). Kept as a fraction to avoid rounding twice.
  const minutesPerWage = (pack.wageBasis === "daily" ? 1 : 26) * pack.dailyHours * 60;
  const regularPaise = Math.round((regularMinutes * wagePaise) / minutesPerWage);
  const otPaise = Math.round((otMinutes * pack.otMultiplier * wagePaise) / minutesPerWage);
  return {
    days: [...perDay].sort().map(([date, minutes]) => ({ date, minutes })),
    totalMinutes,
    regularMinutes,
    otMinutes,
    ratePaisePerHour: Math.round((wagePaise * 60) / minutesPerWage),
    regularPaise,
    otPaise,
    totalPaise: regularPaise + otPaise,
  };
}

export const rupees = (paise: number) =>
  `Rs ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
export const hours = (minutes: number) => +(minutes / 60).toFixed(1);
// Whole rupees for headline figures ("₹8,050"); receipts keep paise via rupees().
export const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;
// "2026-10-27" -> "Tue" (the date is already an Asia/Kolkata day key).
export const weekday = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });
