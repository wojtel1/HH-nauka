import type {
  DailyNutrition,
  FamilyProfile,
  FoodItem,
  IntegrationConnection,
  PhotoAttachment,
  ProfileId,
  TrainingPlan,
  TrainingSession,
} from "./domain";
import { buildBalancedWeek } from "./planner";

export const familyProfiles: FamilyProfile[] = [
  {
    id: "wojtek",
    name: "Wojtek",
    initials: "W",
    role: "owner",
    focus: "Rower · Rouvy · siła",
    device: "Android",
    avatarGradient: "linear-gradient(135deg, #f97316, #9a3412)",
    pinEnabled: true,
    privacy: {
      trainingVisibility: "family",
      nutritionVisibility: "private",
      measurementsVisibility: "private",
      photosVisibility: "family",
    },
    theme: {
      id: "forest-orange",
      name: "Leśny szlak",
      accent: "#ff7a2f",
      accentSoft: "#3b281d",
      background: "linear-gradient(150deg, #0b2119 0%, #122b22 48%, #17231d 100%)",
      surface: "#10251d",
      backgroundLabel: "Górski las o świcie",
    },
  },
  {
    id: "kasia",
    name: "Kasia",
    initials: "K",
    role: "member",
    focus: "Aktywność · mobilność · siła",
    device: "Android · Samsung",
    avatarGradient: "linear-gradient(135deg, #fb7185, #7c3aed)",
    pinEnabled: true,
    privacy: {
      trainingVisibility: "family",
      nutritionVisibility: "private",
      measurementsVisibility: "private",
      photosVisibility: "private",
    },
    theme: {
      id: "alpine-rose",
      name: "Alpejski zmierzch",
      accent: "#fb7185",
      accentSoft: "#3c2030",
      background: "linear-gradient(150deg, #241327 0%, #2b1a31 50%, #182221 100%)",
      surface: "#291b2c",
      backgroundLabel: "Góry o zachodzie słońca",
    },
  },
  {
    id: "maja",
    name: "Maja",
    initials: "M",
    role: "member",
    focus: "Siłownia · progres · forma",
    device: "iPhone",
    avatarGradient: "linear-gradient(135deg, #a78bfa, #2563eb)",
    pinEnabled: true,
    privacy: {
      trainingVisibility: "private",
      nutritionVisibility: "private",
      measurementsVisibility: "private",
      photosVisibility: "private",
    },
    theme: {
      id: "night-violet",
      name: "Nocny szczyt",
      accent: "#a78bfa",
      accentSoft: "#28233d",
      background: "linear-gradient(150deg, #171525 0%, #1c2135 52%, #111d22 100%)",
      surface: "#1f1c30",
      backgroundLabel: "Nocny górski horyzont",
    },
  },
];

export const trainingPlans: TrainingPlan[] = [
  {
    id: "ftp-builder",
    ownerId: "wojtek",
    title: "FTP Builder · 4 tygodnie",
    source: "rouvy",
    weeks: 4,
    sessionsPerWeek: 4,
    progressPercent: 38,
    currentWeek: 2,
    goal: "Więcej mocy progowej przed sezonem",
  },
  {
    id: "winter-balance",
    ownerId: "kasia",
    title: "Zimowa równowaga",
    source: "manual",
    weeks: 6,
    sessionsPerWeek: 4,
    progressPercent: 54,
    currentWeek: 4,
    goal: "Regularność, mobilność i siła",
  },
  {
    id: "strong-foundations",
    ownerId: "maja",
    title: "Strong Foundations",
    source: "manual",
    weeks: 8,
    sessionsPerWeek: 3,
    progressPercent: 31,
    currentWeek: 3,
    goal: "Technika i progres obciążeń",
  },
];

const wojtekWeek = buildBalancedWeek({
  profileId: "wojtek",
  weekOf: "2026-11-19",
  planId: "ftp-builder",
  planName: "FTP Builder",
  cyclingSessions: 4,
  strengthSessions: 2,
});

wojtekWeek[0] = {
  ...wojtekWeek[0],
  status: "completed",
  metrics: {
    distanceKm: 31.8,
    elevationM: 420,
    caloriesKcal: 612,
    averageHeartRate: 146,
    normalizedPowerW: 218,
    tss: 72,
  },
};

wojtekWeek[1] = {
  ...wojtekWeek[1],
  status: "completed",
  metrics: { caloriesKcal: 365, rpe: 7 },
};

const kasiaWeek = buildBalancedWeek({
  profileId: "kasia",
  weekOf: "2026-11-19",
  planId: "winter-balance",
  cyclingSessions: 1,
  strengthSessions: 2,
});

const majaWeek = buildBalancedWeek({
  profileId: "maja",
  weekOf: "2026-11-19",
  planId: "strong-foundations",
  cyclingSessions: 0,
  strengthSessions: 3,
});

export const trainingSessions: TrainingSession[] = [
  ...wojtekWeek,
  ...kasiaWeek.map((session, index) => ({
    ...session,
    status: index === 0 ? ("completed" as const) : session.status,
    metrics: index === 0 ? { caloriesKcal: 290, rpe: 6 } : session.metrics,
  })),
  ...majaWeek.map((session, index) => ({
    ...session,
    status: index === 0 ? ("completed" as const) : session.status,
    metrics: index === 0 ? { caloriesKcal: 245, rpe: 8 } : session.metrics,
  })),
];

export const integrations: IntegrationConnection[] = [
  {
    id: "wojtek-garmin",
    profileId: "wojtek",
    provider: "garmin",
    label: "Garmin Connect",
    description: "Automatyzacja po zatwierdzeniu dostępu API",
    status: "requires_approval",
  },
  {
    id: "wojtek-rouvy",
    profileId: "wojtek",
    provider: "rouvy",
    label: "Rouvy",
    description: "Plan ręczny i bezpieczny import FIT",
    status: "available",
  },
  {
    id: "kasia-health-connect",
    profileId: "kasia",
    provider: "health_connect",
    label: "Samsung Health",
    description: "Przez Health Connect w aplikacji Android",
    status: "planned",
  },
  {
    id: "maja-healthkit",
    profileId: "maja",
    provider: "healthkit",
    label: "Apple Health",
    description: "HealthKit w późniejszej aplikacji iOS",
    status: "planned",
  },
];

const macroTargets: Record<ProfileId, DailyNutrition["target"]> = {
  wojtek: { caloriesKcal: 2500, proteinG: 160, carbohydratesG: 310, fatG: 70 },
  kasia: { caloriesKcal: 1950, proteinG: 120, carbohydratesG: 220, fatG: 65 },
  maja: { caloriesKcal: 2150, proteinG: 135, carbohydratesG: 245, fatG: 70 },
};

export const nutritionByProfile: Record<ProfileId, DailyNutrition> = {
  wojtek: {
    profileId: "wojtek",
    date: "2026-11-19",
    consumed: { caloriesKcal: 1680, proteinG: 112, carbohydratesG: 198, fatG: 54 },
    target: macroTargets.wojtek,
    waterMl: 1850,
  },
  kasia: {
    profileId: "kasia",
    date: "2026-11-19",
    consumed: { caloriesKcal: 1285, proteinG: 84, carbohydratesG: 146, fatG: 47 },
    target: macroTargets.kasia,
    waterMl: 1600,
  },
  maja: {
    profileId: "maja",
    date: "2026-11-19",
    consumed: { caloriesKcal: 1430, proteinG: 96, carbohydratesG: 171, fatG: 43 },
    target: macroTargets.maja,
    waterMl: 1400,
  },
};

export const commonFoods: FoodItem[] = [
  {
    id: "boiled-egg",
    name: "Jajko gotowane",
    servingLabel: "1 sztuka",
    servingGrams: 50,
    caloriesKcal: 78,
    proteinG: 6.3,
    carbohydratesG: 0.6,
    fatG: 5.3,
    favorite: true,
  },
  {
    id: "skyr",
    name: "Skyr naturalny",
    servingLabel: "150 g",
    servingGrams: 150,
    caloriesKcal: 96,
    proteinG: 17,
    carbohydratesG: 6,
    fatG: 0.3,
    favorite: true,
  },
  {
    id: "banana",
    name: "Banan",
    servingLabel: "1 średni",
    servingGrams: 120,
    caloriesKcal: 107,
    proteinG: 1.3,
    carbohydratesG: 27,
    fatG: 0.4,
    favorite: true,
  },
];

export const photos: PhotoAttachment[] = [
  {
    id: "wojtek-trail-photo",
    ownerId: "wojtek",
    linkedTo: "training",
    caption: "Pierwsza mocna sesja tego tygodnia",
    createdAt: "2026-11-17T19:34:00Z",
    visibility: "family",
    dominantColor: "#315746",
  },
  {
    id: "maja-progress-photo",
    ownerId: "maja",
    linkedTo: "progress",
    caption: "Tydzień 3 · prywatny postęp",
    createdAt: "2026-11-18T17:10:00Z",
    visibility: "private",
    dominantColor: "#4c3f72",
  },
];

export function getProfile(profileId: ProfileId) {
  const profile = familyProfiles.find((candidate) => candidate.id === profileId);
  if (!profile) throw new Error(`Nie znaleziono profilu: ${profileId}`);
  return profile;
}

export function getProfileSessions(profileId: ProfileId) {
  return trainingSessions.filter((session) => session.ownerId === profileId);
}

export function getProfilePlan(profileId: ProfileId) {
  return trainingPlans.find((plan) => plan.ownerId === profileId);
}

export function getProfileIntegrations(profileId: ProfileId) {
  return integrations.filter((integration) => integration.profileId === profileId);
}
