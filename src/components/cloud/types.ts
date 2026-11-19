export interface CloudProfile {
  id: string;
  name: string;
  initials: string;
  focus: string;
  accent: string;
}

export interface CloudProgram {
  id: string;
  profileId: string;
  title: string;
  goal: string;
  weeks: number;
  sessionsPerWeek: number;
  currentWeek: number;
  progressPercent: number;
  status: "draft" | "active" | "completed" | "abandoned";
  startedAt: string | null;
  endedAt: string | null;
  endReason: string | null;
}

export interface CloudSession {
  id: string;
  profileId: string;
  programId: string | null;
  scheduledFor: string;
  title: string;
  subtitle: string | null;
  kind: "cycling" | "strength" | "mobility" | "recovery" | "walking" | "hiking";
  environment: "indoor" | "outdoor" | null;
  intensity: "easy" | "moderate" | "hard";
  durationMinutes: number;
  status: "planned" | "completed" | "skipped" | "cancelled";
}

export interface CloudDashboardData {
  householdName: string;
  profiles: CloudProfile[];
  programs: CloudProgram[];
  sessions: CloudSession[];
}
