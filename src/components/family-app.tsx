"use client";

import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

import {
  Dashboard,
  type DashboardData,
  type DashboardProfile,
  type DashboardSession,
  type IntegrationKind,
} from "@/components/dashboard";
import {
  ProfileGate,
  type FamilyProfile as GateProfile,
} from "@/components/profile";
import { InstallPrompt } from "@/components/pwa/install-prompt";
import {
  familyProfiles,
  getProfileIntegrations,
  getProfilePlan,
  getProfileSessions,
  nutritionByProfile,
} from "@/lib/demo-data";
import type {
  FamilyProfile,
  IntegrationConnection,
  IntegrationProvider,
  TrainingKind,
  TrainingSession,
} from "@/lib/domain";
import { formatDuration, formatNumber } from "@/lib/format";
import { calculateWeeklySummary } from "@/lib/planner";

const gateProfiles: GateProfile[] = familyProfiles.map((profile) => ({
  id: profile.id,
  name: profile.name,
  initials: profile.initials,
  subtitle: profile.focus,
  accent: profile.theme.accent,
  background: profile.theme.background,
}));

const dashboardProfiles: Record<FamilyProfile["id"], DashboardProfile> =
  Object.fromEntries(
    familyProfiles.map((profile) => [
      profile.id,
      {
        id: profile.id,
        name: profile.name,
        initials: profile.initials,
        role: profile.focus,
        accent: profile.theme.accent,
        accentSoft: profile.theme.accentSoft,
        focus: profile.focus,
        greeting:
          profile.id === "wojtek"
            ? "Moc na rowerze, stabilność poza nim."
            : profile.id === "kasia"
              ? "Regularność buduje Twoją formę."
              : "Siła rośnie z każdym świadomym powtórzeniem.",
      } satisfies DashboardProfile,
    ]),
  ) as Record<FamilyProfile["id"], DashboardProfile>;

function dashboardKind(session: TrainingSession): DashboardSession["kind"] {
  if (session.kind === "cycling") {
    if (session.environment === "outdoor") return "outdoor-cycling";
    return session.source === "rouvy" ? "rouvy" : "cycling";
  }

  const kinds: Partial<Record<TrainingKind, DashboardSession["kind"]>> = {
    strength: "strength",
    mobility: "mobility",
    recovery: "recovery",
    walking: "walking",
    hiking: "hiking",
  };

  return kinds[session.kind] ?? "recovery";
}

function dashboardSession(session: TrainingSession): DashboardSession {
  const date = parseISO(session.date);
  const intensity = {
    easy: "lekki",
    moderate: "umiarkowany",
    hard: "mocny",
  } as const;

  return {
    id: session.id,
    day: format(date, "EEE", { locale: pl }).replace(".", ""),
    date: format(date, "dd.MM"),
    title: session.title,
    subtitle: session.subtitle ?? "Plan rodzinny",
    duration: formatDuration(session.durationMinutes),
    kind: dashboardKind(session),
    intensity: intensity[session.intensity],
    completed: session.status === "completed",
  };
}

function integrationKind(provider: IntegrationProvider): IntegrationKind {
  if (provider === "garmin") return "garmin";
  if (provider === "health_connect") return "samsung";
  if (provider === "healthkit") return "apple";
  return "manual";
}

function integrationStatus(
  integration: IntegrationConnection,
): "connected" | "available" | "manual" {
  if (integration.status === "connected") return "connected";
  if (integration.provider === "manual" || integration.provider === "fit") {
    return "manual";
  }
  return "available";
}

function makeDashboardData(profile: FamilyProfile): DashboardData {
  const sessions = getProfileSessions(profile.id);
  const summary = calculateWeeklySummary(sessions);
  const nutrition = nutritionByProfile[profile.id];
  const plan = getProfilePlan(profile.id);
  const tss = sessions.reduce(
    (total, session) => total + (session.metrics?.tss ?? 0),
    0,
  );
  const strengthSets = sessions.reduce(
    (total, session) => total + (session.strength?.sets ?? 0),
    0,
  );

  return {
    weekLabel: "16–22 listopada",
    programId: plan?.id ?? `family-plan-${profile.id}`,
    programName: plan?.title ?? "Plan rodzinny",
    programSubtitle: plan?.goal ?? "Regularność i świadomy progres",
    programProgress: plan?.progressPercent ?? summary.completionPercent,
    programWeeks: plan?.weeks ?? 4,
    programCurrentWeek: plan?.currentWeek ?? 1,
    metrics: [
      {
        id: "sessions",
        label: "Sesje w tygodniu",
        value: `${summary.completed} / ${summary.planned}`,
        helper:
          summary.completed === summary.planned
            ? "Plan tygodnia ukończony"
            : `${Math.max(0, summary.planned - summary.completed)} sesje przed Tobą`,
        trend: `${summary.completionPercent}% wykonania`,
        tone: "orange",
      },
      {
        id: "active-time",
        label: "Czas aktywny",
        value: formatDuration(summary.durationMinutes),
        helper: "Tylko ukończone treningi",
        tone: "green",
      },
      {
        id: "load",
        label: profile.id === "wojtek" ? "Obciążenie" : "Serie siłowe",
        value:
          profile.id === "wojtek"
            ? `${formatNumber(tss)} TSS`
            : `${formatNumber(strengthSets)} serii`,
        helper: profile.id === "wojtek" ? "Dane z wykonanych jazd" : "Plan na ten tydzień",
        tone: "blue",
      },
      {
        id: "energy",
        label: "Energia z treningów",
        value: `${formatNumber(summary.caloriesKcal)} kcal`,
        helper: "Zarejestrowane aktywności",
        tone: "stone",
      },
    ],
    sessions: sessions.map(dashboardSession),
    nutrition: {
      consumed: nutrition.consumed.caloriesKcal,
      goal: nutrition.target.caloriesKcal,
      protein: {
        value: nutrition.consumed.proteinG,
        goal: nutrition.target.proteinG,
      },
      carbohydrates: {
        value: nutrition.consumed.carbohydratesG,
        goal: nutrition.target.carbohydratesG,
      },
      fats: {
        value: nutrition.consumed.fatG,
        goal: nutrition.target.fatG,
      },
    },
    integrations: getProfileIntegrations(profile.id).map((integration) => ({
      id: integration.id,
      kind: integrationKind(integration.provider),
      name: integration.label,
      status: integrationStatus(integration),
      detail: integration.description,
    })),
    progress:
      profile.id === "maja"
        ? [
            { label: "T-5", training: 42, recovery: 58 },
            { label: "T-4", training: 48, recovery: 62 },
            { label: "T-3", training: 55, recovery: 66 },
            { label: "T-2", training: 62, recovery: 68 },
            { label: "T-1", training: 69, recovery: 73 },
            { label: "Teraz", training: 76, recovery: 78 },
          ]
        : [
            { label: "T-5", training: 45, recovery: 70 },
            { label: "T-4", training: 57, recovery: 64 },
            { label: "T-3", training: 52, recovery: 75 },
            { label: "T-2", training: 68, recovery: 69 },
            { label: "T-1", training: 73, recovery: 77 },
            { label: "Teraz", training: 81, recovery: 74 },
          ],
    quote:
      profile.id === "maja"
        ? "Siła rośnie tam, gdzie konsekwencja spotyka cierpliwość."
        : "Każdy podjazd zaczyna się od pierwszego obrotu korby.",
  };
}

export function FamilyApp() {
  return (
    <>
      <ProfileGate profiles={gateProfiles}>
        {(gateProfile, controls) => {
          const domainProfile = familyProfiles.find(
            (profile) => profile.id === gateProfile.id,
          );

          if (!domainProfile) return null;

          return (
            <Dashboard
              profile={dashboardProfiles[domainProfile.id]}
              data={makeDashboardData(domainProfile)}
              onLock={controls.lock}
              onSwitchProfile={controls.switchProfile}
            />
          );
        }}
      </ProfileGate>
      <InstallPrompt />
    </>
  );
}
