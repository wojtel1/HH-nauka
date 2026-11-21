export interface ReportSession {
  durationMinutes: number;
  metrics: {
    distanceKm: number | null;
    elevationMeters: number | null;
    perceivedEffort: number | null;
  };
  scheduledFor: string;
  status: "planned" | "completed" | "skipped" | "cancelled";
}

export interface WeeklyTrainingReport {
  scheduled: number;
  completed: number;
  skipped: number;
  completedMinutes: number;
  distanceKm: number;
  elevationMeters: number;
  averageEffort: number | null;
  targetProgressPercent: number;
}

export function buildWeeklyTrainingReport(
  sessions: ReportSession[],
  weekDates: string[],
  targetSessions: number,
): WeeklyTrainingReport {
  const dateSet = new Set(weekDates);
  const weekSessions = sessions.filter((session) => dateSet.has(session.scheduledFor));
  const activeSessions = weekSessions.filter((session) => session.status !== "cancelled");
  const completedSessions = weekSessions.filter((session) => session.status === "completed");
  const efforts = completedSessions
    .map((session) => session.metrics.perceivedEffort)
    .filter((effort): effort is number => effort !== null);

  return {
    scheduled: activeSessions.length,
    completed: completedSessions.length,
    skipped: weekSessions.filter((session) => session.status === "skipped").length,
    completedMinutes: completedSessions.reduce(
      (total, session) => total + session.durationMinutes,
      0,
    ),
    distanceKm: completedSessions.reduce(
      (total, session) => total + (session.metrics.distanceKm ?? 0),
      0,
    ),
    elevationMeters: completedSessions.reduce(
      (total, session) => total + (session.metrics.elevationMeters ?? 0),
      0,
    ),
    averageEffort: efforts.length > 0
      ? efforts.reduce((total, effort) => total + effort, 0) / efforts.length
      : null,
    targetProgressPercent: targetSessions > 0
      ? Math.min(100, Math.round((completedSessions.length / targetSessions) * 100))
      : 0,
  };
}
