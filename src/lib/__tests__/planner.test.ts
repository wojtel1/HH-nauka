import { describe, expect, it } from "vitest";

import type { TrainingSession } from "../domain";
import {
  buildBalancedWeek,
  calculateWeeklySummary,
  isHeavyLegSession,
} from "../planner";

describe("buildBalancedWeek", () => {
  it("tworzy żądaną liczbę sesji i porządkuje je chronologicznie", () => {
    const sessions = buildBalancedWeek({
      profileId: "wojtek",
      weekOf: "2026-11-19",
      planId: "ftp-builder",
      planName: "FTP Builder",
      cyclingSessions: 4,
      strengthSessions: 2,
    });

    expect(sessions).toHaveLength(6);
    expect(sessions.filter((session) => session.kind === "cycling")).toHaveLength(4);
    expect(sessions.filter((session) => session.kind === "strength")).toHaveLength(2);
    expect(sessions.map((session) => session.date)).toEqual(
      [...sessions].map((session) => session.date).sort(),
    );
  });

  it("nie ustawia ciężkiego treningu nóg dzień przed mocną jazdą", () => {
    const sessions = buildBalancedWeek({
      profileId: "wojtek",
      weekOf: "2026-11-19",
      cyclingSessions: 4,
      strengthSessions: 3,
    });
    const hardRideDates = new Set(
      sessions
        .filter(
          (session) => session.kind === "cycling" && session.intensity === "hard",
        )
        .map((session) => session.date),
    );

    for (const session of sessions.filter(isHeavyLegSession)) {
      const nextDay = new Date(`${session.date}T12:00:00Z`);
      nextDay.setUTCDate(nextDay.getUTCDate() + 1);
      expect(hardRideDates.has(nextDay.toISOString().slice(0, 10))).toBe(false);
    }
  });

  it("planuje jazdę outdoor, spacer i hike jako osobne aktywności", () => {
    const sessions = buildBalancedWeek({
      profileId: "kasia",
      weekOf: "2026-11-19",
      cyclingSessions: 1,
      outdoorCyclingSessions: 1,
      strengthSessions: 1,
      walkingSessions: 1,
      hikingSessions: 1,
    });

    expect(sessions).toHaveLength(5);
    expect(
      sessions.some(
        (session) =>
          session.kind === "cycling" && session.environment === "outdoor",
      ),
    ).toBe(true);
    expect(sessions.some((session) => session.kind === "walking")).toBe(true);
    expect(sessions.some((session) => session.kind === "hiking")).toBe(true);
    expect(new Set(sessions.map((session) => session.date)).size).toBe(5);
  });

  it("odrzuca tydzień z więcej niż jedną sesją dziennie", () => {
    expect(() =>
      buildBalancedWeek({
        profileId: "kasia",
        weekOf: "2026-11-19",
        cyclingSessions: 5,
        strengthSessions: 3,
      }),
    ).toThrow(/maksymalnie jedną sesję/i);
  });
});

describe("calculateWeeklySummary", () => {
  it("liczy wykonanie tylko na podstawie ukończonych sesji", () => {
    const sessions: TrainingSession[] = [
      {
        id: "one",
        ownerId: "maja",
        date: "2026-11-17",
        time: "17:00",
        title: "Full body",
        kind: "strength",
        intensity: "moderate",
        durationMinutes: 50,
        status: "completed",
        source: "manual",
        visibility: "private",
        metrics: { caloriesKcal: 280 },
      },
      {
        id: "two",
        ownerId: "maja",
        date: "2026-11-19",
        time: "17:00",
        title: "Góra ciała",
        kind: "strength",
        intensity: "easy",
        durationMinutes: 45,
        status: "planned",
        source: "manual",
        visibility: "private",
      },
    ];

    expect(calculateWeeklySummary(sessions)).toEqual({
      planned: 2,
      completed: 1,
      durationMinutes: 50,
      caloriesKcal: 280,
      completionPercent: 50,
    });
  });
});
