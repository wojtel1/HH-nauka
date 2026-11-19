export type DashboardSection = "overview" | "plan" | "nutrition" | "progress";

export type SessionKind =
  | "rouvy"
  | "cycling"
  | "outdoor-cycling"
  | "strength"
  | "recovery"
  | "mobility"
  | "walking"
  | "hiking";

export type IntegrationKind =
  | "garmin"
  | "samsung"
  | "apple"
  | "manual";

export interface DashboardProfile {
  id: string;
  name: string;
  initials: string;
  role: string;
  accent: string;
  accentSoft: string;
  avatarUrl?: string;
  greeting?: string;
  focus?: string;
}

export interface DashboardMetric {
  id: string;
  label: string;
  value: string;
  helper: string;
  trend?: string;
  tone: "orange" | "green" | "blue" | "stone";
}

export interface DashboardSession {
  id: string;
  day: string;
  date: string;
  title: string;
  subtitle: string;
  duration: string;
  kind: SessionKind;
  intensity?: "lekki" | "umiarkowany" | "mocny";
  completed: boolean;
}

export interface NutritionSummary {
  consumed: number;
  goal: number;
  protein: { value: number; goal: number };
  carbohydrates: { value: number; goal: number };
  fats: { value: number; goal: number };
}

export interface IntegrationStatus {
  id: string;
  kind: IntegrationKind;
  name: string;
  status: "connected" | "available" | "manual";
  detail: string;
}

export interface ProgressPoint {
  label: string;
  training: number;
  recovery: number;
}

export interface DashboardData {
  weekLabel: string;
  programId: string;
  programName: string;
  programSubtitle: string;
  programProgress: number;
  programWeeks: number;
  programCurrentWeek: number;
  metrics: DashboardMetric[];
  sessions: DashboardSession[];
  nutrition: NutritionSummary;
  integrations: IntegrationStatus[];
  progress: ProgressPoint[];
  quote: string;
}

export interface DashboardProps {
  profile: DashboardProfile;
  data?: DashboardData;
  onSwitchProfile?: () => void;
  onLock?: () => void;
}
