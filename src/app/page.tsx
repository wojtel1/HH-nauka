import { redirect } from "next/navigation";

import { FamilyApp } from "@/components/family-app";
import { hasSupabaseEnvironment } from "@/lib/supabase/config";

export default function Home() {
  if (hasSupabaseEnvironment()) redirect("/cloud");

  return <FamilyApp />;
}
