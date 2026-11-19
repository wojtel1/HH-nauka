"use client";

import { ArrowRight, CheckCircle2, Mail, ShieldCheck } from "lucide-react";
import { useState, type FormEvent } from "react";

import { createClient } from "@/lib/supabase/client";

type SubmissionState = "idle" | "sending" | "sent" | "error";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<SubmissionState>("idle");
  const [message, setMessage] = useState("");

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setState("sending");
    setMessage("");

    const supabase = createClient();
    const redirectTo = `${window.location.origin}/auth/confirm?next=/cloud`;
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: redirectTo },
    });

    if (error) {
      setState("error");
      setMessage(
        error.status === 429
          ? "Odczekaj chwilę przed wysłaniem kolejnej wiadomości."
          : "Nie udało się wysłać linku. Sprawdź adres i spróbuj ponownie.",
      );
      return;
    }

    setState("sent");
    setMessage("Link logowania został wysłany. Sprawdź skrzynkę e-mail.");
  };

  return (
    <form onSubmit={submit} className="mt-8 space-y-4">
      <label htmlFor="email" className="block text-sm font-bold text-white/75">
        Adres e-mail
      </label>
      <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-black/15 px-4 focus-within:border-orange-300/50">
        <Mail aria-hidden="true" className="size-5 shrink-0 text-orange-300/70" />
        <input
          id="email"
          name="email"
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          disabled={state === "sending"}
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          placeholder="twoj@email.pl"
          className="min-w-0 flex-1 bg-transparent py-4 text-base text-white outline-none placeholder:text-white/25"
        />
      </div>
      <button
        type="submit"
        disabled={state === "sending" || !email.trim()}
        className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-400 px-5 py-4 text-sm font-black text-[#102019] transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {state === "sending" ? "Wysyłanie…" : "Wyślij bezpieczny link"}
        {state !== "sending" ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
      </button>

      {message ? (
        <p
          role="status"
          className={`flex items-start gap-2 rounded-2xl border px-4 py-3 text-sm ${
            state === "sent"
              ? "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
              : "border-red-300/20 bg-red-400/10 text-red-100"
          }`}
        >
          {state === "sent" ? (
            <CheckCircle2 aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          ) : (
            <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
          )}
          {message}
        </p>
      ) : null}
    </form>
  );
}
