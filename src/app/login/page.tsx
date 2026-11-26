import { Bike, Cloud, ShieldCheck, Smartphone } from "lucide-react";
import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/login-form";
import { InstallMenu } from "@/components/pwa/install-menu";
import { hasSupabaseEnvironment } from "@/lib/supabase/config";
import { createClient } from "@/lib/supabase/server";

// The login route checks the request session before rendering.
export const instant = false;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const cloudConfigured = hasSupabaseEnvironment();

  if (cloudConfigured) {
    const supabase = await createClient();
    const { data } = await supabase.auth.getClaims();
    if (data?.claims) redirect("/cloud");
  }
  const invalidLink = (await searchParams).error === "invalid_link";

  return (
    <main className="min-h-dvh bg-[#07130f] px-4 py-8 text-white sm:grid sm:place-items-center sm:p-8">
      <section className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-[#102019]/95 p-6 shadow-2xl sm:p-8">
        <span className="grid size-14 place-items-center rounded-2xl bg-orange-400 text-[#102019]">
          <Bike aria-hidden="true" className="size-7" />
        </span>
        <p className="mt-7 text-[11px] font-black uppercase tracking-[0.2em] text-orange-300/80">
          Endurance
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">Zaloguj się do rodziny</h1>
        <p className="mt-3 text-sm leading-6 text-white/50">
          Wyślemy jednorazowy link. Nie musisz tworzyć ani zapamiętywać hasła.
        </p>

        {invalidLink ? (
          <p role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            Nie udało się potwierdzić logowania. Zamów nowy link i otwórz go na urządzeniu, z którego go wysłano.
          </p>
        ) : null}

        {cloudConfigured ? (
          <LoginForm />
        ) : (
          <p role="alert" className="mt-6 rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm text-red-100">
            Brakuje konfiguracji Supabase. Uzupełnij plik .env.local.
          </p>
        )}

        <InstallMenu />
        <div className="mt-8 grid grid-cols-3 gap-2 border-t border-white/8 pt-6 text-center text-[10px] font-bold text-white/35">
          <span className="grid gap-2"><Cloud aria-hidden="true" className="mx-auto size-4" />Synchronizacja</span>
          <span className="grid gap-2"><Smartphone aria-hidden="true" className="mx-auto size-4" />Telefony</span>
          <span className="grid gap-2"><ShieldCheck aria-hidden="true" className="mx-auto size-4" />Prywatność</span>
        </div>
      </section>
    </main>
  );
}
