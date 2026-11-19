export interface ProgramTemplate {
  id: string;
  title: string;
  goal: string;
  weeks: number;
}

export interface ActiveProgram extends ProgramTemplate {
  currentWeek: number;
  progressPercent: number;
  startedAt: string;
}

export interface ProgramHistoryEntry extends ActiveProgram {
  endedAt: string;
  endReason: string;
  outcome: "completed" | "abandoned";
}

export interface ProgramLifecycle {
  active: ActiveProgram | null;
  history: ProgramHistoryEntry[];
}

export type ProgramLifecycleByProfile = Record<string, ProgramLifecycle>;

export function createProgramLifecycle(active: ActiveProgram): ProgramLifecycle {
  return { active, history: [] };
}

export function startProgram(
  lifecycle: ProgramLifecycle,
  template: ProgramTemplate,
  startedAt = new Date().toISOString(),
): ProgramLifecycle {
  if (lifecycle.active) {
    throw new Error("Najpierw zakończ aktywny program.");
  }

  return {
    ...lifecycle,
    active: {
      ...template,
      currentWeek: 1,
      progressPercent: 0,
      startedAt,
    },
  };
}

export function endProgram(
  lifecycle: ProgramLifecycle,
  endReason: string,
  endedAt = new Date().toISOString(),
): ProgramLifecycle {
  if (!lifecycle.active) {
    throw new Error("Brak aktywnego programu do zakończenia.");
  }

  const outcome =
    lifecycle.active.progressPercent >= 100 ? "completed" : "abandoned";

  return {
    active: null,
    history: [
      {
        ...lifecycle.active,
        endedAt,
        endReason: endReason.trim() || "Zmiana planu treningowego",
        outcome,
      },
      ...lifecycle.history,
    ],
  };
}

function isActiveProgram(value: unknown): value is ActiveProgram {
  if (!value || typeof value !== "object") return false;
  const candidate = value as Partial<ActiveProgram>;
  return (
    typeof candidate.id === "string" &&
    typeof candidate.title === "string" &&
    typeof candidate.goal === "string" &&
    typeof candidate.weeks === "number" &&
    typeof candidate.currentWeek === "number" &&
    typeof candidate.progressPercent === "number" &&
    typeof candidate.startedAt === "string"
  );
}

export function parseProgramLifecycles(value: string): ProgramLifecycleByProfile {
  try {
    const parsed: unknown = JSON.parse(value);
    if (!parsed || typeof parsed !== "object") return {};

    return Object.fromEntries(
      Object.entries(parsed).flatMap(([profileId, rawLifecycle]) => {
        if (!rawLifecycle || typeof rawLifecycle !== "object") return [];
        const lifecycle = rawLifecycle as Partial<ProgramLifecycle>;
        if (lifecycle.active !== null && !isActiveProgram(lifecycle.active)) {
          return [];
        }

        const history = Array.isArray(lifecycle.history)
          ? lifecycle.history.filter(
              (entry): entry is ProgramHistoryEntry =>
                isActiveProgram(entry) &&
                typeof entry.endedAt === "string" &&
                typeof entry.endReason === "string" &&
                (entry.outcome === "completed" || entry.outcome === "abandoned"),
            )
          : [];

        return [[profileId, { active: lifecycle.active ?? null, history }]];
      }),
    );
  } catch {
    return {};
  }
}
