import { describe, expect, it } from "vitest";

import { generateWeeklyTrainingPlan, spreadSessionDays } from "@/lib/training-plan";

describe("weekly plan generator", () => {
  it("spreads common training volumes across the week", () => {
    expect(spreadSessionDays(1)).toEqual([2]);
    expect(spreadSessionDays(4)).toEqual([0, 2, 4, 6]);
    expect(spreadSessionDays(7)).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it("normalizes the selected date to Monday", () => {
    const plan = generateWeeklyTrainingPlan("2026-11-26", 4, "balanced");
    expect(plan.map((session) => session.scheduledFor)).toEqual([
      "2026-11-23",
      "2026-11-25",
      "2026-11-27",
      "2026-11-29",
    ]);
  });

  it("includes outdoor cycling, walking and hiking in a balanced week", () => {
    const plan = generateWeeklyTrainingPlan("2026-11-23", 4, "balanced");
    expect(plan.map((session) => session.kind)).toEqual([
      "cycling",
      "strength",
      "walking",
      "hiking",
    ]);
    expect(plan[0].environment).toBe("outdoor");
  });

  it("creates two sessions on some days for high-volume plans", () => {
    const plan = generateWeeklyTrainingPlan("2026-11-23", 10, "cycling");
    expect(plan).toHaveLength(10);
    expect(new Set(plan.map((session) => session.scheduledFor)).size).toBeLessThan(10);
  });
});
