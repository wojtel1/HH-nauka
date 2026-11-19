export type ProfileId = "wojtek" | "kasia" | "maja";

export type FamilyVisibility = "private" | "family";

export type TrainingKind =
  | "cycling"
  | "strength"
  | "mobility"
  | "recovery"
  | "walking"
  | "hiking";

export type ActivityEnvironment = "indoor" | "outdoor";

export type TrainingIntensity = "easy" | "moderate" | "hard";

export type TrainingStatus =
  | "planned"
  | "completed"
  | "skipped"
  | "moved";

export type IntegrationProvider =
  | "manual"
  | "fit"
  | "rouvy"
  | "garmin"
  | "health_connect"
  | "healthkit";

export type IntegrationStatus =
  | "available"
  | "connected"
  | "planned"
  | "requires_approval";

export interface ProfileTheme {
  id: string;
  name: string;
  accent: string;
  accentSoft: string;
  background: string;
  surface: string;
  backgroundLabel: string;
}

export interface PrivacySettings {
  trainingVisibility: FamilyVisibility;
  nutritionVisibility: FamilyVisibility;
  measurementsVisibility: FamilyVisibility;
  photosVisibility: FamilyVisibility;
}

export interface FamilyProfile {
  id: ProfileId;
  name: string;
  initials: string;
  role: "owner" | "member";
  focus: string;
  device: string;
  theme: ProfileTheme;
  avatarGradient: string;
  privacy: PrivacySettings;
  pinEnabled: boolean;
}

export interface IntegrationConnection {
  id: string;
  profileId: ProfileId;
  provider: IntegrationProvider;
  label: string;
  description: string;
  status: IntegrationStatus;
  lastSyncAt?: string;
}

export interface TrainingMetrics {
  distanceKm?: number;
  elevationM?: number;
  caloriesKcal?: number;
  averageHeartRate?: number;
  normalizedPowerW?: number;
  tss?: number;
  rpe?: number;
}

export interface StrengthBlock {
  focus: "lower" | "upper" | "full-body" | "core";
  exercises: number;
  sets: number;
}

export interface TrainingSession {
  id: string;
  ownerId: ProfileId;
  planId?: string;
  date: string;
  time: string;
  title: string;
  subtitle?: string;
  kind: TrainingKind;
  environment?: ActivityEnvironment;
  intensity: TrainingIntensity;
  durationMinutes: number;
  status: TrainingStatus;
  source: IntegrationProvider;
  visibility: FamilyVisibility;
  strength?: StrengthBlock;
  metrics?: TrainingMetrics;
}

export interface TrainingPlan {
  id: string;
  ownerId: ProfileId;
  title: string;
  source: IntegrationProvider;
  weeks: number;
  sessionsPerWeek: number;
  progressPercent: number;
  currentWeek: number;
  goal: string;
}

export interface MacroBreakdown {
  proteinG: number;
  carbohydratesG: number;
  fatG: number;
}

export interface NutritionTarget extends MacroBreakdown {
  caloriesKcal: number;
}

export interface DailyNutrition {
  profileId: ProfileId;
  date: string;
  consumed: NutritionTarget;
  target: NutritionTarget;
  waterMl: number;
}

export interface FoodItem extends MacroBreakdown {
  id: string;
  name: string;
  servingLabel: string;
  servingGrams: number;
  caloriesKcal: number;
  favorite: boolean;
}

export interface PhotoAttachment {
  id: string;
  ownerId: ProfileId;
  linkedTo: "training" | "measurement" | "meal" | "progress";
  caption: string;
  createdAt: string;
  visibility: FamilyVisibility;
  dominantColor: string;
}

export interface WeeklySummary {
  planned: number;
  completed: number;
  durationMinutes: number;
  caloriesKcal: number;
  completionPercent: number;
}
