"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";
import { calculateProgramProgress } from "@/lib/cloud-progress";

export interface WorkspaceActionState {
  message: string;
}

export interface CloudActionState {
  status: "idle" | "success" | "error";
  message: string;
}

const profileSchema = z.object({
  householdId: z.string().uuid(),
  name: z.string().trim().min(1).max(80),
  focus: z.string().trim().max(120),
});

const programSchema = z.object({
  profileId: z.string().uuid(),
  title: z.string().trim().min(1).max(120),
  goal: z.string().trim().max(240),
  weeks: z.coerce.number().int().min(1).max(104),
  sessionsPerWeek: z.coerce.number().int().min(1).max(14),
});

const sessionSchema = z.object({
  profileId: z.string().uuid(),
  programId: z.string().uuid().or(z.literal("")),
  scheduledFor: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  title: z.string().trim().min(1).max(160),
  subtitle: z.string().trim().max(160),
  kind: z.enum(["cycling", "strength", "mobility", "recovery", "walking", "hiking"]),
  environment: z.enum(["indoor", "outdoor"]),
  intensity: z.enum(["easy", "moderate", "hard"]),
  durationMinutes: z.coerce.number().int().min(1).max(1440),
});

async function authenticatedClient() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims?.sub) redirect("/login");
  return { supabase, userId: data.claims.sub };
}

async function profileIsAccessible(
  supabase: Awaited<ReturnType<typeof createClient>>,
  profileId: string,
) {
  const { data } = await supabase
    .from("profiles")
    .select("id")
    .eq("id", profileId)
    .maybeSingle();
  return Boolean(data);
}

const workspaceSchema = z.object({
  householdName: z.string().trim().min(1).max(80),
  ownerName: z.string().trim().min(1).max(80),
});

export async function createFamilyWorkspace(
  _previousState: WorkspaceActionState,
  formData: FormData,
): Promise<WorkspaceActionState> {
  const input = workspaceSchema.safeParse({
    householdName: formData.get("householdName"),
    ownerName: formData.get("ownerName"),
  });

  if (!input.success) {
    return { message: "Uzupełnij obie nazwy (maksymalnie 80 znaków)." };
  }

  const supabase = await createClient();
  const { data: auth, error: authError } = await supabase.auth.getClaims();
  if (authError || !auth?.claims?.sub) redirect("/login");

  const { error } = await supabase.rpc("create_family_workspace", {
    household_name: input.data.householdName,
    owner_display_name: input.data.ownerName,
  });

  if (error) {
    const migrationMissing =
      error.code === "PGRST202" || error.message.includes("create_family_workspace");
    return {
      message: migrationMissing
        ? "Baza wymaga jeszcze aktualizacji. Uruchom najnowszą migrację Supabase i spróbuj ponownie."
        : "Nie udało się utworzyć przestrzeni. Odśwież stronę i spróbuj ponownie.",
    };
  }

  revalidatePath("/cloud");
  redirect("/cloud");
}

export async function addProfile(
  _previousState: CloudActionState,
  formData: FormData,
): Promise<CloudActionState> {
  const input = profileSchema.safeParse({
    householdId: formData.get("householdId"),
    name: formData.get("name"),
    focus: formData.get("focus") ?? "",
  });
  if (!input.success) {
    return { status: "error", message: "Uzupełnij poprawnie nazwę profilu." };
  }

  const { supabase } = await authenticatedClient();
  const accentPalette = ["#ff7a2f", "#fb7185", "#8b5cf6", "#38bdf8", "#34d399"];
  const accent = accentPalette[input.data.name.length % accentPalette.length];
  const { error } = await supabase.from("profiles").insert({
    household_id: input.data.householdId,
    auth_user_id: null,
    name: input.data.name,
    initials: input.data.name.slice(0, 2).toLocaleUpperCase("pl"),
    focus: input.data.focus,
    theme: { accent },
  });

  if (error) {
    return { status: "error", message: "Nie udało się dodać profilu." };
  }
  revalidatePath("/cloud");
  return { status: "success", message: "Profil został dodany." };
}

export async function createProgram(
  _previousState: CloudActionState,
  formData: FormData,
): Promise<CloudActionState> {
  const input = programSchema.safeParse({
    profileId: formData.get("profileId"),
    title: formData.get("title"),
    goal: formData.get("goal") ?? "",
    weeks: formData.get("weeks"),
    sessionsPerWeek: formData.get("sessionsPerWeek"),
  });
  if (!input.success) {
    return { status: "error", message: "Sprawdź nazwę, długość i liczbę treningów." };
  }

  const { supabase, userId } = await authenticatedClient();
  if (!(await profileIsAccessible(supabase, input.data.profileId))) {
    return { status: "error", message: "Nie masz dostępu do tego profilu." };
  }

  const { error } = await supabase.from("training_programs").insert({
    profile_id: input.data.profileId,
    title: input.data.title,
    goal: input.data.goal,
    weeks: input.data.weeks,
    sessions_per_week: input.data.sessionsPerWeek,
    current_week: 1,
    progress_percent: 0,
    status: "active",
    started_at: new Date().toISOString(),
    created_by: userId,
  });
  if (error) {
    return {
      status: "error",
      message: error.code === "23505" ? "Najpierw zakończ aktywny program." : "Nie udało się rozpocząć programu.",
    };
  }
  revalidatePath("/cloud");
  return { status: "success", message: "Nowy program został rozpoczęty." };
}

export async function createTrainingSession(
  _previousState: CloudActionState,
  formData: FormData,
): Promise<CloudActionState> {
  const input = sessionSchema.safeParse({
    profileId: formData.get("profileId"),
    programId: formData.get("programId") ?? "",
    scheduledFor: formData.get("scheduledFor"),
    title: formData.get("title"),
    subtitle: formData.get("subtitle") ?? "",
    kind: formData.get("kind"),
    environment: formData.get("environment") ?? "outdoor",
    intensity: formData.get("intensity"),
    durationMinutes: formData.get("durationMinutes"),
  });
  if (!input.success) {
    return { status: "error", message: "Uzupełnij poprawnie dane treningu." };
  }

  const { supabase } = await authenticatedClient();
  if (!(await profileIsAccessible(supabase, input.data.profileId))) {
    return { status: "error", message: "Nie masz dostępu do tego profilu." };
  }
  if (input.data.programId) {
    const { data: program } = await supabase
      .from("training_programs")
      .select("id, profile_id")
      .eq("id", input.data.programId)
      .maybeSingle();
    if (!program || program.profile_id !== input.data.profileId) {
      return { status: "error", message: "Wybrany program nie należy do tego profilu." };
    }
  }
  const { error } = await supabase.from("training_sessions").insert({
    profile_id: input.data.profileId,
    program_id: input.data.programId || null,
    scheduled_for: input.data.scheduledFor,
    title: input.data.title,
    subtitle: input.data.subtitle || null,
    kind: input.data.kind,
    environment: input.data.environment,
    intensity: input.data.intensity,
    duration_minutes: input.data.durationMinutes,
    status: "planned",
    source: "manual",
  });
  if (error) {
    return { status: "error", message: "Nie udało się zapisać treningu." };
  }
  revalidatePath("/cloud");
  return { status: "success", message: "Trening został zapisany." };
}

export async function setTrainingSessionStatus(formData: FormData) {
  const parsed = z.object({
    sessionId: z.string().uuid(),
    status: z.enum(["planned", "completed", "skipped", "cancelled"]),
  }).safeParse({
    sessionId: formData.get("sessionId"),
    status: formData.get("status"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const { data: session } = await supabase
    .from("training_sessions")
    .select("id, program_id")
    .eq("id", parsed.data.sessionId)
    .maybeSingle();
  if (!session) return;

  await supabase
    .from("training_sessions")
    .update({
      status: parsed.data.status,
      completed_at: parsed.data.status === "completed" ? new Date().toISOString() : null,
    })
    .eq("id", parsed.data.sessionId);

  if (session.program_id) {
    const { data: programSessions } = await supabase
      .from("training_sessions")
      .select("status")
      .eq("program_id", session.program_id);
    const progress = calculateProgramProgress(
      programSessions?.map((item) => item.status) ?? [],
    );
    await supabase
      .from("training_programs")
      .update({ progress_percent: progress })
      .eq("id", session.program_id);
  }
  revalidatePath("/cloud");
}

export async function endTrainingProgram(formData: FormData) {
  const parsed = z.object({
    programId: z.string().uuid(),
    outcome: z.enum(["completed", "abandoned"]),
  }).safeParse({
    programId: formData.get("programId"),
    outcome: formData.get("outcome"),
  });
  if (!parsed.success) return;

  const { supabase } = await authenticatedClient();
  const endValues = {
    status: parsed.data.outcome,
    ended_at: new Date().toISOString(),
    end_reason: parsed.data.outcome === "completed"
      ? "Program ukończony"
      : "Zmiana programu treningowego",
    ...(parsed.data.outcome === "completed" ? { progress_percent: 100 } : {}),
  };
  await supabase
    .from("training_programs")
    .update(endValues)
    .eq("id", parsed.data.programId)
    .eq("status", "active");
  revalidatePath("/cloud");
}

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
