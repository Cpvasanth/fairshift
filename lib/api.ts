import type { Hazard } from "./store";

// Response shapes of /api/hazards, shared by the route and the pages that call it.
export type Board = { version: number; hazards: Hazard[] };
export type Receipt = Pick<Hazard, "id" | "status" | "category" | "severity">;
export type Filed = Pick<Hazard, "id" | "category" | "severity" | "summaryEn">;
export type SealedFiled = { theme: string };
