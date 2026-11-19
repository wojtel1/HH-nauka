import { LogOut } from "lucide-react";
import { redirect } from "next/navigation";

import { FamilyApp } from "@/components/family-app";
import { WorkspaceSetup } from "@/components/cloud/workspace-setup";
import { createClient } from "@/lib/supabase/server";

import { signOut } from "./actions";

// This authenticated route reads request cookies and Supabase on every visit.
export const instant = false;

export default async function CloudAppPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();
  if (error || !data?.claims) redirect("/login");

  const userId = data.claims.sub;
  const { data: membership, error: membershipError } = await supabase
    .from("household_members")
    .select("household_id")
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

  return (
    <>
      <div className="fixed right-3 top-3 z-50">
        <form action={signOut}>
          <button type="submit" className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#102019]/95 px-3 py-2 text-xs font-bold text-white/60 shadow-lg backdrop-blur transition hover:text-white">
            <LogOut aria-hidden="true" className="size-4" />
            Wyloguj
          </button>
        </form>
      </div>
      <FamilyApp />
    </>
  );
}
