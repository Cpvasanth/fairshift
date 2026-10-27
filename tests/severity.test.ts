import { describe, expect, it } from "vitest";
import { packs } from "../lib/rules";
import { finalSeverity } from "../lib/severity";

describe("finalSeverity", () => {
  it("AI says LOW for fall from height -> pack floor HIGH", () => {
    expect(finalSeverity("LOW", "fall from height", packs.construction)).toBe("HIGH");
  });
  it("AI can raise severity above the floor", () => {
    expect(finalSeverity("HIGH", "heat stress", packs.construction)).toBe("HIGH");
  });
  it("categories without a floor keep the AI value", () => {
    expect(finalSeverity("LOW", "slippery floor", packs.college)).toBe("LOW");
  });
  it("floors are per pack: fire exit blocked is HIGH on campus", () => {
    expect(finalSeverity("MEDIUM", "fire exit blocked", packs.college)).toBe("HIGH");
  });
});
