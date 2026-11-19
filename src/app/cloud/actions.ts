"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createClient } from "@/lib/supabase/server";

export interface WorkspaceActionState {
  message: string;
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

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
