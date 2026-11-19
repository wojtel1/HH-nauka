import { describe, expect, it } from "vitest";

import {
  createProgramLifecycle,
  endProgram,
  parseProgramLifecycles,
  startProgram,
} from "../program-lifecycle";

const active = {
  id: "ftp-builder",
  title: "FTP Builder",
  goal: "Więcej mocy",
  weeks: 4,
  currentWeek: 2,
  progressPercent: 38,
  startedAt: "2026-11-01T09:00:00.000Z",
};

describe("program lifecycle", () => {
  it("zachowuje zakończony program w historii", () => {
    const result = endProgram(
      createProgramLifecycle(active),
      "Chcę zmienić cel",
      "2026-11-19T10:00:00.000Z",
    );

    expect(result.active).toBeNull();
    expect(result.history[0]).toMatchObject({
      id: "ftp-builder",
      endReason: "Chcę zmienić cel",
      outcome: "abandoned",
    });
  });

  it("pozwala uruchomić nowy program po zakończeniu poprzedniego", () => {
    const ended = endProgram(createProgramLifecycle(active), "Zmiana planu");
    const result = startProgram(
      ended,
      { id: "regularity", title: "Regularność", goal: "Stały rytm", weeks: 6 },
      "2026-11-19T11:00:00.000Z",
    );

    expect(result.active).toMatchObject({
      id: "regularity",
      currentWeek: 1,
      progressPercent: 0,
    });
    expect(result.history).toHaveLength(1);
  });

  it("odrzuca uszkodzony zapis lokalny", () => {
    expect(parseProgramLifecycles("nie-json")).toEqual({});
    expect(parseProgramLifecycles('{"wojtek":{"active":{"id":1}}}')).toEqual({});
  });
});
