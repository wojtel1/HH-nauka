"use client";

import { ArrowRight, Cloud, ShieldCheck, UsersRound } from "lucide-react";
import { useActionState } from "react";
import { JoinFamily } from "./family-invitation";
import { InstallMenu } from "@/components/pwa/install-menu";

import {
  createFamilyWorkspace,
} from "@/app/cloud/actions";

interface WorkspaceSetupProps {
  defaultOwnerName: string;
}

export function WorkspaceSetup({ defaultOwnerName }: WorkspaceSetupProps) {
  const [state, formAction, isPending] = useActionState(
    createFamilyWorkspace,
    { message: "" },
  );

  return (
    <main className="min-h-dvh bg-[#071a14] px-4 py-8 text-white sm:grid sm:place-items-center sm:p-8">
      <section className="mx-auto w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#10251d]/95 p-6 shadow-2xl shadow-black/30 sm:p-9">
        <div className="flex items-start justify-between gap-4">
          <span className="grid size-14 place-items-center rounded-2xl bg-orange-400 text-[#102019]">
            <UsersRound aria-hidden="true" className="size-7" />
          </span>
          <span className="inline-flex items-center gap-2 rounded-full border border-emerald-300/15 bg-emerald-300/[.08] px-3 py-2 text-[11px] font-bold text-emerald-200">
            <Cloud aria-hidden="true" className="size-4" />
            Konto chmurowe
          </span>
        </div>

        <p className="mt-7 text-[11px] font-black uppercase tracking-[.22em] text-orange-300">
          Pierwsze uruchomienie
        </p>
        <h1 className="mt-2 text-3xl font-black tracking-tight">
          Utwórz przestrzeń rodzinną
        </h1>
        <p className="mt-3 text-sm leading-6 text-white/55">
          Od tego momentu profile, programy i treningi będą przypisane do
          Waszego konta, a nie do wersji demonstracyjnej w telefonie.
        </p>

        <form action={formAction} className="mt-8 space-y-5">
          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              Nazwa rodziny lub grupy
            </span>
            <input
              name="householdName"
              type="text"
              required
              minLength={1}
              maxLength={80}
              defaultValue="Nasza rodzina"
              disabled={isPending}
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-base outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
            />
          </label>

          <label className="block">
            <span className="mb-2 block text-sm font-bold text-white/75">
              Twoja nazwa profilu
            </span>
            <input
              name="ownerName"
              type="text"
              required
              minLength={1}
              maxLength={80}
              defaultValue={defaultOwnerName}
              disabled={isPending}
              className="w-full rounded-2xl border border-white/10 bg-black/15 px-4 py-4 text-base outline-none transition placeholder:text-white/25 focus:border-orange-300/50"
            />
          </label>

          {state.message ? (
            <p
              role="alert"
              className="rounded-2xl border border-red-300/20 bg-red-400/10 px-4 py-3 text-sm leading-5 text-red-100"
            >
              {state.message}
            </p>
          ) : null}

          <button
            type="submit"
            disabled={isPending}
            className="flex w-full items-center justify-center gap-2 rounded-2xl bg-orange-400 px-5 py-4 text-sm font-black text-[#102019] transition hover:bg-orange-300 disabled:cursor-wait disabled:opacity-60"
          >
            {isPending ? "Tworzenie…" : "Utwórz bezpieczną przestrzeń"}
            {!isPending ? <ArrowRight aria-hidden="true" className="size-4" /> : null}
          </button>
        </form>

        <JoinFamily />
        <InstallMenu />
        <p className="mt-6 flex items-start gap-2 text-xs leading-5 text-white/40">
          <ShieldCheck aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-emerald-300/70" />
          Tylko zalogowani członkowie tej przestrzeni otrzymają dostęp do
          zapisanych danych.
        </p>
      </section>
    </main>
  );
}
