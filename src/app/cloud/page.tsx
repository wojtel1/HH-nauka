import { redirect } from "next/navigation";
import { connection } from "next/server";

import { CloudDashboard } from "@/components/cloud/cloud-dashboard";
import { WorkspaceSetup } from "@/components/cloud/workspace-setup";
import type {
  CloudProgram,
  CloudProfile,
  CloudSession,
} from "@/components/cloud/types";
import { createClient } from "@/lib/supabase/server";

// This authenticated route reads request cookies and Supabase on every visit.
export const instant = false;

export default async function CloudAppPage() {
  await connection();
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub;
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (membershipError) {
    throw new Error("Nie udało się odczytać przestrzeni rodzinnej.");
  }

  if (!membership) {
    const email = typeof data.claims.email === "string" ? data.claims.email : "";
    const defaultOwnerName = email.includes("@") ? email.split("@")[0] : "";
    return <WorkspaceSetup defaultOwnerName={defaultOwnerName} />;
  }

  const [householdResult, profilesResult] = await Promise.all([
    supabase
      .from("households")
      .select("id, name")
      .eq("id", membership.household_id)
      .single(),
    supabase
      .from("profiles")
      .select("id, name, initials, focus, theme")
      .eq("household_id", membership.household_id)
      .order("created_at", { ascending: true }),
  ]);

  if (householdResult.error || profilesResult.error || !householdResult.data) {
    throw new Error("Nie udało się wczytać danych rodzinnych.");
  }

  const profiles: CloudProfile[] = (profilesResult.data ?? []).map((profile) => {
    const theme = profile.theme && typeof profile.theme === "object"
      ? (profile.theme as Record<string, unknown>)
      : {};
    return {
      id: profile.id,
      name: profile.name,
      initials: profile.initials,
      focus: profile.focus,
      accent: typeof theme.accent === "string" ? theme.accent : "#ff7a2f",
    };
  });
  const profileIds = profiles.map((profile) => profile.id);

  const [programsResult, sessionsResult] = profileIds.length > 0
    ? await Promise.all([
        supabase
          .from("training_programs")
          .select("id, profile_id, title, goal, weeks, sessions_per_week, current_week, progress_percent, status, started_at, ended_at, end_reason")
          .in("profile_id", profileIds)
          .order("created_at", { ascending: false }),
        supabase
          .from("training_sessions")
          .select("id, profile_id, program_id, scheduled_for, title, subtitle, kind, environment, intensity, duration_minutes, status, completed_at, metrics")
          .in("profile_id", profileIds)
          .order("scheduled_for", { ascending: true })
          .limit(1000),
      ])
    : [{ data: [], error: null }, { data: [], error: null }];

  if (programsResult.error || sessionsResult.error) {
    throw new Error("Nie udało się wczytać programów i treningów.");
  }

  const programs: CloudProgram[] = (programsResult.data ?? []).map((program) => ({
    id: program.id,
    profileId: program.profile_id,
    title: program.title,
    goal: program.goal,
    weeks: program.weeks,
    sessionsPerWeek: program.sessions_per_week,
    currentWeek: program.current_week,
    progressPercent: program.progress_percent,
    status: program.status,
    startedAt: program.started_at,
    endedAt: program.ended_at,
    endReason: program.end_reason,
  }));

  const sessions: CloudSession[] = (sessionsResult.data ?? []).map((session) => {
    const metrics = session.metrics && typeof session.metrics === "object"
      ? (session.metrics as Record<string, unknown>)
      : {};
    return {
      id: session.id,
      profileId: session.profile_id,
      programId: session.program_id,
      scheduledFor: session.scheduled_for,
      title: session.title,
      subtitle: session.subtitle,
      kind: session.kind,
      environment: session.environment,
      intensity: session.intensity,
      durationMinutes: session.duration_minutes,
      status: session.status,
      completedAt: session.completed_at,
      metrics: {
        distanceKm: typeof metrics.distanceKm === "number" ? metrics.distanceKm : null,
        elevationMeters: typeof metrics.elevationMeters === "number" ? metrics.elevationMeters : null,
        perceivedEffort: typeof metrics.perceivedEffort === "number" ? metrics.perceivedEffort : null,
        notes: typeof metrics.notes === "string" ? metrics.notes : "",
      },
    };
  });

  return (
    <CloudDashboard
      householdId={membership.household_id}
      today={new Date().toISOString().slice(0, 10)}
      data={{
        householdName: householdResult.data.name,
        profiles,
        programs,
        sessions,
      }}
    />
  );
}
