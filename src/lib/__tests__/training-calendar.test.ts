import { describe, expect, it } from "vitest";

import { addDaysISO, getWeekDates, startOfWeekISO } from "@/lib/training-calendar";

describe("training calendar", () => {
  it("finds Monday for dates throughout a week", () => {
    expect(startOfWeekISO("2026-11-16")).toBe("2026-11-16");
    expect(startOfWeekISO("2026-11-21")).toBe("2026-11-16");
    expect(startOfWeekISO("2026-11-22")).toBe("2026-11-16");
  });

  it("moves safely across month and year boundaries", () => {
    expect(addDaysISO("2026-12-31", 1)).toBe("2027-01-01");
    expect(addDaysISO("2027-01-01", -1)).toBe("2026-12-31");
  });

  it("returns a complete Monday-to-Sunday range", () => {
    expect(getWeekDates("2026-11-21")).toEqual([
      "2026-11-16",
      "2026-11-17",
      "2026-11-18",
      "2026-11-19",
      "2026-11-20",
      "2026-11-21",
      "2026-11-22",
    ]);
  });
});
