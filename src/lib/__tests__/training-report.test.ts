import { describe, expect, it } from "vitest";

import { buildWeeklyTrainingReport, type ReportSession } from "@/lib/training-report";

const week = ["2026-11-16", "2026-11-17", "2026-11-18", "2026-11-19", "2026-11-20", "2026-11-21", "2026-11-22"];

function session(overrides: Partial<ReportSession> = {}): ReportSession {
  return {
    durationMinutes: 60,
    metrics: { distanceKm: null, elevationMeters: null, perceivedEffort: null },
    scheduledFor: "2026-11-18",
    status: "planned",
    ...overrides,
  };
}

describe("weekly training report", () => {
  it("counts only sessions from the selected week", () => {
    const report = buildWeeklyTrainingReport([
      session({ status: "completed" }),
      session({ scheduledFor: "2026-11-25", status: "completed" }),
      session({ status: "skipped" }),
    ], week, 4);

    expect(report.completed).toBe(1);
    expect(report.skipped).toBe(1);
    expect(report.scheduled).toBe(2);
    expect(report.targetProgressPercent).toBe(25);
  });

  it("sums completed results and ignores planned sessions", () => {
    const report = buildWeeklyTrainingReport([
      session({ status: "completed", durationMinutes: 75, metrics: { distanceKm: 32.5, elevationMeters: 410, perceivedEffort: 7 } }),
      session({ status: "completed", durationMinutes: 45, metrics: { distanceKm: 6, elevationMeters: 90, perceivedEffort: 5 } }),
      session({ status: "planned", metrics: { distanceKm: 100, elevationMeters: 1000, perceivedEffort: 10 } }),
    ], week, 2);

    expect(report.completedMinutes).toBe(120);
    expect(report.distanceKm).toBe(38.5);
    expect(report.elevationMeters).toBe(500);
    expect(report.averageEffort).toBe(6);
    expect(report.targetProgressPercent).toBe(100);
  });

  it("handles a week without completed training", () => {
    const report = buildWeeklyTrainingReport([], week, 4);
    expect(report.averageEffort).toBeNull();
    expect(report.distanceKm).toBe(0);
    expect(report.targetProgressPercent).toBe(0);
  });
});
