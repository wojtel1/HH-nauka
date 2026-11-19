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
  /** Indoor cycling sessions, such as Rouvy. */
  cyclingSessions: number;
  outdoorCyclingSessions?: number;
  strengthSessions: number;
  walkingSessions?: number;
  hikingSessions?: number;
}

const RIDE_DAY_PRIORITY = [1, 3, 5, 0, 2, 4, 6] as const;
const OUTDOOR_RIDE_DAY_PRIORITY = [5, 6, 3, 1, 0, 2, 4] as const;
const STRENGTH_DAY_PRIORITY = [2, 4, 0, 6, 3, 1, 5] as const;
const WALK_DAY_PRIORITY = [0, 4, 2, 6, 1, 3, 5] as const;
const HIKE_DAY_PRIORITY = [6, 5, 4, 0, 2, 3, 1] as const;

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

function takeFreeDays(
  priority: readonly number[],
  count: number,
  occupiedDays: ReadonlySet<number>,
) {
  return priority.filter((day) => !occupiedDays.has(day)).slice(0, count);
}

export function isHeavyLegSession(session: TrainingSession) {
  return session.kind === "strength" && session.strength?.focus === "lower";
}

export function buildBalancedWeek(
  request: BalancedWeekRequest,
): TrainingSession[] {
  const outdoorCyclingSessions = request.outdoorCyclingSessions ?? 0;
  const walkingSessions = request.walkingSessions ?? 0;
  const hikingSessions = request.hikingSessions ?? 0;

  if (
    !Number.isInteger(request.cyclingSessions) ||
    request.cyclingSessions < 0 ||
    request.cyclingSessions > 5
  ) {
    throw new RangeError("Liczba treningów rowerowych indoor musi wynosić od 0 do 5.");
  }

  if (
    !Number.isInteger(outdoorCyclingSessions) ||
    outdoorCyclingSessions < 0 ||
    outdoorCyclingSessions > 5
  ) {
    throw new RangeError("Liczba jazd outdoor musi wynosić od 0 do 5.");
  }

  if (
    !Number.isInteger(request.strengthSessions) ||
    request.strengthSessions < 0 ||
    request.strengthSessions > 4
  ) {
    throw new RangeError("Liczba treningów siłowych musi wynosić od 0 do 4.");
  }

  if (!Number.isInteger(walkingSessions) || walkingSessions < 0 || walkingSessions > 7) {
    throw new RangeError("Liczba spacerów musi wynosić od 0 do 7.");
  }

  if (!Number.isInteger(hikingSessions) || hikingSessions < 0 || hikingSessions > 3) {
    throw new RangeError("Liczba wędrówek musi wynosić od 0 do 3.");
  }

  const requestedSessions =
    request.cyclingSessions +
    outdoorCyclingSessions +
    request.strengthSessions +
    walkingSessions +
    hikingSessions;

  if (requestedSessions > 7) {
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
      environment: "indoor",
      intensity,
      durationMinutes: intensity === "hard" ? 65 : intensity === "moderate" ? 55 : 45,
      status: "planned",
      source: "rouvy",
      visibility: "family",
    } satisfies TrainingSession;
  });

  const occupiedDays = new Set<number>(selectedRideDays);
  const selectedOutdoorRideDays = takeFreeDays(
    OUTDOOR_RIDE_DAY_PRIORITY,
    outdoorCyclingSessions,
    occupiedDays,
  );
  selectedOutdoorRideDays.forEach((day) => occupiedDays.add(day));

  const outdoorRides = selectedOutdoorRideDays.map((dayOffset, index) => ({
    id: `${request.profileId}-outdoor-ride-${isoDay(weekStart, dayOffset)}`,
    ownerId: request.profileId,
    planId: request.planId,
    date: isoDay(weekStart, dayOffset),
    time: dayOffset === 5 || dayOffset === 6 ? "09:30" : "17:45",
    title: index % 2 === 0 ? "Jazda outdoor · wytrzymałość" : "Jazda outdoor · swobodne tempo",
    subtitle: "Rower na zewnątrz",
    kind: "cycling",
    environment: "outdoor",
    intensity: index % 2 === 0 ? "moderate" : "easy",
    durationMinutes: dayOffset === 5 || dayOffset === 6 ? 90 : 60,
    status: "planned",
    source: "manual",
    visibility: "family",
  })) satisfies TrainingSession[];

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

  chosenStrengthDays.forEach((day) => occupiedDays.add(day));

  const selectedHikeDays = takeFreeDays(
    HIKE_DAY_PRIORITY,
    hikingSessions,
    occupiedDays,
  );
  selectedHikeDays.forEach((day) => occupiedDays.add(day));
  const hikes = selectedHikeDays.map((dayOffset) => ({
    id: `${request.profileId}-hike-${isoDay(weekStart, dayOffset)}`,
    ownerId: request.profileId,
    planId: request.planId,
    date: isoDay(weekStart, dayOffset),
    time: dayOffset === 5 || dayOffset === 6 ? "10:00" : "17:30",
    title: "Hike · wędrówka terenowa",
    subtitle: "Aktywność na zewnątrz",
    kind: "hiking",
    environment: "outdoor",
    intensity: "moderate",
    durationMinutes: dayOffset === 5 || dayOffset === 6 ? 150 : 90,
    status: "planned",
    source: "manual",
    visibility: "family",
  })) satisfies TrainingSession[];

  const selectedWalkDays = takeFreeDays(
    WALK_DAY_PRIORITY,
    walkingSessions,
    occupiedDays,
  );
  const walks = selectedWalkDays.map((dayOffset) => ({
    id: `${request.profileId}-walk-${isoDay(weekStart, dayOffset)}`,
    ownerId: request.profileId,
    planId: request.planId,
    date: isoDay(weekStart, dayOffset),
    time: "18:30",
    title: "Spacer regeneracyjny",
    subtitle: "Lekki ruch na zewnątrz",
    kind: "walking",
    environment: "outdoor",
    intensity: "easy",
    durationMinutes: 45,
    status: "planned",
    source: "manual",
    visibility: "family",
  })) satisfies TrainingSession[];

  return [...rides, ...outdoorRides, ...strength, ...hikes, ...walks].sort((a, b) =>
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
