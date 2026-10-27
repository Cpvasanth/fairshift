// Cross-industry is config, not code: one rule pack per industry.
// Defaults are illustrative; verify the applicable state rule before using real figures.
export type Severity = "LOW" | "MEDIUM" | "HIGH";

export type Pack = {
  id: string;
  industry: string;
  site: string;
  wageBasis: "daily" | "monthly";
  dailyHours: number;
  weeklyHours: number;
  otMultiplier: number;
  categories: [string, ...string[]];
  severityFloor: Record<string, Severity>;
  themes: [string, ...string[]];
};

export const packs: Record<string, Pack> = {
  construction: {
    id: "construction",
    industry: "Construction site",
    site: "Velachery Tower",
    wageBasis: "daily",
    dailyHours: 8,
    weeklyHours: 48,
    otMultiplier: 2,
    categories: ["fall from height", "scaffolding", "electrical", "no PPE", "heat stress", "other"],
    severityFloor: { "fall from height": "HIGH", electrical: "HIGH" },
    themes: ["drinking water", "toilets", "wage delay", "supervisor abuse", "safety gear", "other"],
  },
  college: {
    id: "college",
    industry: "College campus",
    site: "Greenfield College campus",
    wageBasis: "monthly",
    dailyHours: 8,
    weeklyHours: 48,
    otMultiplier: 2,
    categories: ["electrical", "lab chemical", "fire exit blocked", "structural damage", "slippery floor", "other"],
    severityFloor: { electrical: "HIGH", "fire exit blocked": "HIGH" },
    themes: ["wage delay", "shift length", "harassment", "rest room", "safety gear", "other"],
  },
};
