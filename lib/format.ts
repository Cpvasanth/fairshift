// Display helpers. Logic works in integer minutes and paise; these only format for people.

export const rupees = (paise: number) =>
  `Rs ${(paise / 100).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

// Whole rupees for headline figures ("₹8,050"); receipts keep paise via rupees().
export const inr = (paise: number) => `₹${Math.round(paise / 100).toLocaleString("en-IN")}`;

export const hours = (minutes: number) => +(minutes / 60).toFixed(1);

// "2026-10-27" -> "Tue" (the date is already an Asia/Kolkata day key).
export const weekday = (date: string) =>
  new Date(`${date}T00:00:00Z`).toLocaleDateString("en-IN", { weekday: "short", timeZone: "UTC" });

// Elapsed time, short: "just now", "12m", "3h 5m", "2d 4h".
export const ago = (ms: number) => {
  const m = Math.max(0, Math.round(ms / 60_000));
  if (m < 1) return "just now";
  if (m < 60) return `${m}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `${h}h ${m % 60}m` : `${Math.floor(h / 24)}d ${h % 24}h`;
};
