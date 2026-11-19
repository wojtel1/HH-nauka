import { describe, expect, it } from "vitest";

import { calculateProgramProgress } from "../cloud-progress";

describe("calculateProgramProgress", () => {
  it("zwraca zero dla programu bez sesji", () => {
    expect(calculateProgramProgress([])).toBe(0);
  });

  it("liczy udział ukończonych sesji", () => {
    expect(calculateProgramProgress(["completed", "planned", "completed", "skipped"])).toBe(50);
  });

  it("zaokrągla postęp do pełnego procenta", () => {
    expect(calculateProgramProgress(["completed", "planned", "planned"])).toBe(33);
  });
});
