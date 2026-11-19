import { addDays, format, parseISO, startOfWeek } from "date-fns";

import type {
  ProfileId,
  TrainingIntensity,
  TrainingSession,
  WeeklySummary,
} from "./domain";

export interface BalancedWeekRequest {
  profileId: ProfileId;
  weekOf: string;
  planId?: string;
  planName?: string;
  cyclingSessions: number;
  strengthSessions: number;
}

const RIDE_DAY_PRIORITY = [1, 3, 5, 0, 2, 4, 6] as const;
const STRENGTH_DAY_PRIORITY = [2, 4, 0, 6, 3, 1, 5] as const;

function isoDay(weekStart: Date, dayOffset: number) {
  return format(addDays(weekStart, dayOffset), "yyyy-MM-dd");
}

function rideIntensity(index: number, count: number): TrainingIntensity {
  if (index === 0 || (count >= 3 && index === count - 1)) {
    return "hard";
  }

  return index % 2 === 0 ? "moderate" : "easy";
}

function cyclingTitle(intensity: TrainingIntensity, planName?: string) {
  const prefix = planName ? `${planName}: ` : "";

  if (intensity === "hard") return `${prefix}interwały progowe`;
  if (intensity === "moderate") return `${prefix}tempo i technika`;
  return `${prefix}spokojna jazda`;
}

export function isHeavyLegSession(session: TrainingSession) {
  return session.kind === "strength" && session.strength?.focus === "lower";
}

export function buildBalancedWeek(
  request: BalancedWeekRequest,
): TrainingSession[] {
  if (
    !Number.isInteger(request.cyclingSessions) ||
    request.cyclingSessions < 0 ||
    request.cyclingSessions > 5
  ) {
    throw new RangeError("Liczba treningów rowerowych musi wynosić od 0 do 5.");
  }

  if (
    !Number.isInteger(request.strengthSessions) ||
    request.strengthSessions < 0 ||
    request.strengthSessions > 4
  ) {
    throw new RangeError("Liczba treningów siłowych musi wynosić od 0 do 4.");
  }

  if (request.cyclingSessions + request.strengthSessions > 7) {
    throw new RangeError("W tej wersji planujemy maksymalnie jedną sesję dziennie.");
  }

  const weekStart = startOfWeek(parseISO(request.weekOf), { weekStartsOn: 1 });
  const selectedRideDays = RIDE_DAY_PRIORITY.slice(
    0,
    request.cyclingSessions,
  );
  const hardRideDays = new Set<number>();

  const rides = selectedRideDays.map((dayOffset, index) => {
    const intensity = rideIntensity(index, request.cyclingSessions);
    if (intensity === "hard") hardRideDays.add(dayOffset);

    return {
      id: `${request.profileId}-ride-${isoDay(weekStart, dayOffset)}`,
      ownerId: request.profileId,
      planId: request.planId,
      date: isoDay(weekStart, dayOffset),
      time: dayOffset === 5 || dayOffset === 6 ? "09:00" : "18:15",
      title: cyclingTitle(intensity, request.planName),
      subtitle: intensity === "hard" ? "Rouvy · wysoka jakość" : "Rouvy",
      kind: "cycling",
      intensity,
      durationMinutes: intensity === "hard" ? 65 : intensity === "moderate" ? 55 : 45,
      status: "planned",
      source: "rouvy",
      visibility: "family",
    } satisfies TrainingSession;
  });

  const occupiedDays = new Set(selectedRideDays);
  const freeStrengthDays = STRENGTH_DAY_PRIORITY.filter(
    (dayOffset) => !occupiedDays.has(dayOffset),
  );
  const lowerBodyDay = freeStrengthDays.find(
    (dayOffset) => !hardRideDays.has(dayOffset + 1),
  );

  const chosenStrengthDays: number[] = [];
  if (lowerBodyDay !== undefined && request.strengthSessions > 0) {
    chosenStrengthDays.push(lowerBodyDay);
  }

  for (const dayOffset of freeStrengthDays) {
    if (chosenStrengthDays.length >= request.strengthSessions) break;
    if (!chosenStrengthDays.includes(dayOffset)) chosenStrengthDays.push(dayOffset);
  }

  const strength = chosenStrengthDays.map((dayOffset, index) => {
    const isLower = dayOffset === lowerBodyDay;
    const focus = isLower ? "lower" : index % 2 === 0 ? "upper" : "full-body";

    return {
      id: `${request.profileId}-strength-${isoDay(weekStart, dayOffset)}`,
      ownerId: request.profileId,
      planId: request.planId,
      date: isoDay(weekStart, dayOffset),
      time: dayOffset === 6 ? "10:30" : "18:00",
      title: isLower ? "Siła nóg i core" : focus === "upper" ? "Góra ciała" : "Full body",
      subtitle: isLower ? "Stabilizacja i moc" : "Siłownia",
      kind: "strength",
      intensity: isLower ? "moderate" : "easy",
      durationMinutes: isLower ? 55 : 45,
      status: "planned",
      source: "manual",
      visibility: "family",
      strength: {
        focus,
        exercises: isLower ? 6 : 5,
        sets: isLower ? 18 : 15,
      },
    } satisfies TrainingSession;
  });

  return [...rides, ...strength].sort((a, b) =>
    `${a.date}T${a.time}`.localeCompare(`${b.date}T${b.time}`),
  );
}

export function calculateWeeklySummary(
  sessions: readonly TrainingSession[],
): WeeklySummary {
  const completed = sessions.filter((session) => session.status === "completed");
  const planned = sessions.filter((session) => session.status !== "skipped").length;

  return {
    planned,
    completed: completed.length,
    durationMinutes: completed.reduce(
      (total, session) => total + session.durationMinutes,
      0,
    ),
    caloriesKcal: completed.reduce(
      (total, session) => total + (session.metrics?.caloriesKcal ?? 0),
      0,
    ),
    completionPercent: planned === 0 ? 0 : Math.round((completed.length / planned) * 100),
  };
}
