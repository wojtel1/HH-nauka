"use client";

import {
  Activity,
  Bike,
  Check,
  ChevronDown,
  CirclePlus,
  Clock3,
  Cloud,
  Dumbbell,
  Footprints,
  LogOut,
  Mountain,
  Plus,
  RotateCcw,
  ShieldCheck,
} from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import {
  addProfile,
  createProgram,
  createTrainingSession,
  endTrainingProgram,
  setTrainingSessionStatus,
  signOut,
  type CloudActionState,
} from "@/app/cloud/actions";

import type { CloudDashboardData, CloudSession } from "./types";

interface CloudDashboardProps {
  data: CloudDashboardData;
  householdId: string;
  today: string;
}

const initialActionState: CloudActionState = { status: "idle", message: "" };
const fieldClass =
  "w-full rounded-xl border border-white/10 bg-black/15 px-3 py-3 text-sm text-white outline-none transition placeholder:text-white/25 focus:border-orange-300/50";

const kindLabels: Record<CloudSession["kind"], string> = {
  cycling: "Rower",
  strength: "Siła",
  mobility: "Mobilność",
  recovery: "Regeneracja",
  walking: "Spacer",
  hiking: "Hike",
};

const intensityLabels: Record<CloudSession["intensity"], string> = {
  easy: "lekki",
  moderate: "umiarkowany",
  hard: "mocny",
};

function KindIcon({ kind }: { kind: CloudSession["kind"] }) {
  const className = "size-5";
  if (kind === "cycling") return <Bike aria-hidden="true" className={className} />;
  if (kind === "strength") return <Dumbbell aria-hidden="true" className={className} />;
  if (kind === "walking") return <Footprints aria-hidden="true" className={className} />;
  if (kind === "hiking") return <Mountain aria-hidden="true" className={className} />;
  return <Activity aria-hidden="true" className={className} />;
}

function ActionMessage({ state }: { state: CloudActionState }) {
  if (!state.message) return null;
  return (
    <p
      role="status"
      className={`rounded-xl border px-3 py-2 text-xs ${
        state.status === "error"
          ? "border-red-300/20 bg-red-400/10 text-red-100"
          : "border-emerald-300/20 bg-emerald-400/10 text-emerald-100"
      }`}
    >
      {state.message}
    </p>
  );
}

export function CloudDashboard({ data, householdId, today }: CloudDashboardProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(data.profiles[0]?.id ?? "");
  const [profileState, profileAction, profilePending] = useActionState(
    addProfile,
    initialActionState,
  );
  const [programState, programAction, programPending] = useActionState(
    createProgram,
    initialActionState,
  );
  const [sessionState, sessionAction, sessionPending] = useActionState(
    createTrainingSession,
    initialActionState,
  );

  const profile = data.profiles.find((item) => item.id === selectedProfileId) ?? data.profiles[0];
  const profilePrograms = useMemo(
    () => data.programs.filter((program) => program.profileId === profile?.id),
    [data.programs, profile?.id],
  );
  const activeProgram = profilePrograms.find((program) => program.status === "active") ?? null;
  const history = profilePrograms.filter((program) => program.status !== "active");
  const sessions = useMemo(
    () => data.sessions.filter((session) => session.profileId === profile?.id),
    [data.sessions, profile?.id],
  );
  const completed = sessions.filter((session) => session.status === "completed");
  const completedMinutes = completed.reduce((total, session) => total + session.durationMinutes, 0);

  if (!profile) return null;

  return (
    <main className="min-h-dvh bg-[#071a14] text-white">
      <header className="sticky top-0 z-40 border-b border-white/8 bg-[#071a14]/90 px-4 py-3 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-orange-400 text-[#102019]">
              <Bike aria-hidden="true" className="size-5" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-base font-black tracking-tight">Endurance</p>
              <p className="truncate text-[10px] font-bold uppercase tracking-[.16em] text-white/35">
                {data.householdName} · chmura
              </p>
            </div>
          </div>
          <form action={signOut}>
            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/[.04] px-3 py-2 text-xs font-bold text-white/55 transition hover:text-white"
            >
              <LogOut aria-hidden="true" className="size-4" />
              <span className="hidden sm:inline">Wyloguj</span>
            </button>
          </form>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-5 sm:px-6 sm:py-8">
        <section className="rounded-[1.75rem] border border-white/10 bg-[#10251d]/85 p-4 shadow-2xl shadow-black/20 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.2em] text-orange-300">Kto dziś trenuje?</p>
              <h1 className="mt-1 text-2xl font-black tracking-tight">Profile rodzinne</h1>
            </div>
            <details className="relative">
              <summary className="grid size-10 cursor-pointer list-none place-items-center rounded-xl bg-orange-400 text-[#102019] transition hover:bg-orange-300">
                <Plus aria-hidden="true" className="size-5" />
                <span className="sr-only">Dodaj profil</span>
              </summary>
              <div className="absolute right-0 z-20 mt-2 w-[min(22rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#10251d] p-4 shadow-2xl">
                <p className="font-black">Nowy profil</p>
                <form action={profileAction} className="mt-3 space-y-3">
                  <input type="hidden" name="householdId" value={householdId} />
                  <input className={fieldClass} name="name" required maxLength={80} placeholder="Imię" />
                  <input className={fieldClass} name="focus" maxLength={120} placeholder="Cel, np. forma i spacery" />
                  <ActionMessage state={profileState} />
                  <button disabled={profilePending} className="w-full rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-[#102019] disabled:opacity-50">
                    {profilePending ? "Dodawanie…" : "Dodaj profil"}
                  </button>
                </form>
              </div>
            </details>
          </div>

          <div className="mt-5 flex gap-2 overflow-x-auto pb-1" aria-label="Wybierz profil">
            {data.profiles.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setSelectedProfileId(item.id)}
                className={`flex shrink-0 items-center gap-3 rounded-2xl border px-3 py-2.5 text-left transition ${
                  item.id === profile.id ? "border-orange-300/40 bg-orange-300/10" : "border-white/8 bg-white/[.03]"
                }`}
              >
                <span className="grid size-10 place-items-center rounded-xl text-sm font-black" style={{ background: item.accent }}>
                  {item.initials}
                </span>
                <span>
                  <span className="block text-sm font-black">{item.name}</span>
                  <span className="block max-w-40 truncate text-[10px] text-white/40">{item.focus || "Aktywny profil"}</span>
                </span>
              </button>
            ))}
          </div>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-2xl border border-white/8 bg-white/[.04] p-4">
            <p className="text-xs text-white/45">Zaplanowane</p>
            <p className="mt-2 text-2xl font-black">{sessions.length}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[.04] p-4">
            <p className="text-xs text-white/45">Ukończone</p>
            <p className="mt-2 text-2xl font-black text-emerald-300">{completed.length}</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[.04] p-4">
            <p className="text-xs text-white/45">Aktywny czas</p>
            <p className="mt-2 text-2xl font-black">{Math.floor(completedMinutes / 60)}h {completedMinutes % 60}m</p>
          </div>
          <div className="rounded-2xl border border-white/8 bg-white/[.04] p-4">
            <p className="text-xs text-white/45">Postęp programu</p>
            <p className="mt-2 text-2xl font-black text-orange-300">{activeProgram?.progressPercent ?? 0}%</p>
          </div>
        </section>

        <div className="mt-4 grid gap-4 lg:grid-cols-[.9fr_1.4fr]">
          <section className="rounded-[1.75rem] border border-white/10 bg-[#10251d]/80 p-5">
            <div className="flex items-center gap-3">
              <span className="grid size-10 place-items-center rounded-xl bg-orange-300/10 text-orange-300">
                <Activity aria-hidden="true" className="size-5" />
              </span>
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">Program treningowy</p>
                <h2 className="font-black">{activeProgram?.title ?? "Brak aktywnego programu"}</h2>
              </div>
            </div>

            {activeProgram ? (
              <div className="mt-5">
                <p className="text-sm leading-6 text-white/55">{activeProgram.goal || "Regularność i świadomy progres"}</p>
                <div className="mt-4 h-2 overflow-hidden rounded-full bg-white/8">
                  <div className="h-full rounded-full bg-orange-400" style={{ width: `${activeProgram.progressPercent}%` }} />
                </div>
                <div className="mt-3 flex justify-between text-xs text-white/40">
                  <span>{activeProgram.weeks} tygodni</span>
                  <span>{activeProgram.sessionsPerWeek} sesji / tydz.</span>
                </div>
                <div className="mt-5 grid grid-cols-2 gap-2">
                  <form action={endTrainingProgram}>
                    <input type="hidden" name="programId" value={activeProgram.id} />
                    <input type="hidden" name="outcome" value="completed" />
                    <button className="w-full rounded-xl bg-emerald-400/15 px-3 py-3 text-xs font-black text-emerald-200 hover:bg-emerald-400/25">
                      Ukończ program
                    </button>
                  </form>
                  <form action={endTrainingProgram}>
                    <input type="hidden" name="programId" value={activeProgram.id} />
                    <input type="hidden" name="outcome" value="abandoned" />
                    <button className="w-full rounded-xl border border-white/10 px-3 py-3 text-xs font-black text-white/55 hover:bg-white/5">
                      Zmień program
                    </button>
                  </form>
                </div>
              </div>
            ) : (
              <form action={programAction} className="mt-5 space-y-3">
                <input type="hidden" name="profileId" value={profile.id} />
                <input className={fieldClass} name="title" required maxLength={120} placeholder="Nazwa programu" />
                <textarea className={fieldClass} name="goal" maxLength={240} placeholder="Główny cel" rows={2} />
                <div className="grid grid-cols-2 gap-2">
                  <label className="text-xs text-white/45">Tygodnie<input className={`${fieldClass} mt-1`} name="weeks" type="number" min={1} max={104} defaultValue={8} required /></label>
                  <label className="text-xs text-white/45">Sesje / tydz.<input className={`${fieldClass} mt-1`} name="sessionsPerWeek" type="number" min={1} max={14} defaultValue={4} required /></label>
                </div>
                <ActionMessage state={programState} />
                <button disabled={programPending} className="w-full rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-[#102019] disabled:opacity-50">
                  {programPending ? "Rozpoczynanie…" : "Rozpocznij program"}
                </button>
              </form>
            )}

            {history.length > 0 ? (
              <details className="mt-5 border-t border-white/8 pt-4">
                <summary className="flex cursor-pointer list-none items-center justify-between text-xs font-bold text-white/45">
                  Historia programów ({history.length}) <ChevronDown aria-hidden="true" className="size-4" />
                </summary>
                <div className="mt-3 space-y-2">
                  {history.map((program) => (
                    <div key={program.id} className="rounded-xl bg-black/15 p-3 text-xs">
                      <p className="font-bold text-white/75">{program.title}</p>
                      <p className="mt-1 text-white/35">{program.status === "completed" ? "Ukończony" : "Zakończony wcześniej"} · {program.progressPercent}%</p>
                    </div>
                  ))}
                </div>
              </details>
            ) : null}
          </section>

          <section className="rounded-[1.75rem] border border-white/10 bg-[#10251d]/80 p-5">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-black uppercase tracking-[.18em] text-white/35">Plan</p>
                <h2 className="text-xl font-black">Treningi</h2>
              </div>
              <details className="relative">
                <summary className="inline-flex cursor-pointer list-none items-center gap-2 rounded-xl bg-orange-400 px-3 py-2.5 text-xs font-black text-[#102019]">
                  <CirclePlus aria-hidden="true" className="size-4" /> Dodaj
                </summary>
                <div className="absolute right-0 z-20 mt-2 w-[min(25rem,calc(100vw-2rem))] rounded-2xl border border-white/10 bg-[#10251d] p-4 shadow-2xl">
                  <p className="font-black">Nowy trening</p>
                  <form action={sessionAction} className="mt-3 space-y-3">
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="programId" value={activeProgram?.id ?? ""} />
                    <input className={fieldClass} name="title" required maxLength={160} placeholder="Nazwa treningu" />
                    <input className={fieldClass} name="subtitle" maxLength={160} placeholder="Opis (opcjonalnie)" />
                    <div className="grid grid-cols-2 gap-2">
                      <input className={fieldClass} name="scheduledFor" type="date" defaultValue={today} required />
                      <input className={fieldClass} name="durationMinutes" type="number" min={1} max={1440} defaultValue={60} required aria-label="Czas w minutach" />
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <select className={fieldClass} name="kind" defaultValue="cycling">
                        <option value="cycling">Rower</option><option value="walking">Spacer</option><option value="hiking">Hike</option><option value="strength">Siła</option><option value="mobility">Mobilność</option><option value="recovery">Regeneracja</option>
                      </select>
                      <select className={fieldClass} name="environment" defaultValue="outdoor">
                        <option value="outdoor">Na zewnątrz</option><option value="indoor">Wewnątrz</option>
                      </select>
                    </div>
                    <select className={fieldClass} name="intensity" defaultValue="moderate">
                      <option value="easy">Lekki</option><option value="moderate">Umiarkowany</option><option value="hard">Mocny</option>
                    </select>
                    <ActionMessage state={sessionState} />
                    <button disabled={sessionPending} className="w-full rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-[#102019] disabled:opacity-50">
                      {sessionPending ? "Zapisywanie…" : "Zapisz trening"}
                    </button>
                  </form>
                </div>
              </details>
            </div>

            <div className="mt-5 space-y-2">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <Cloud aria-hidden="true" className="mx-auto size-7 text-white/20" />
                  <p className="mt-3 text-sm font-bold text-white/55">Brak zapisanych treningów</p>
                  <p className="mt-1 text-xs text-white/30">Dodaj pierwszą jazdę, spacer, hike lub trening siłowy.</p>
                </div>
              ) : (
                sessions.map((session) => (
                  <article key={session.id} className={`rounded-2xl border p-3 sm:p-4 ${session.status === "completed" ? "border-emerald-300/15 bg-emerald-300/[.05]" : "border-white/8 bg-black/10"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${session.status === "completed" ? "bg-emerald-300/15 text-emerald-300" : "bg-orange-300/10 text-orange-300"}`}>
                        <KindIcon kind={session.kind} />
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <div><p className="font-black leading-5">{session.title}</p><p className="mt-1 text-[11px] text-white/35">{session.scheduledFor} · {kindLabels[session.kind]}{session.environment ? ` · ${session.environment === "outdoor" ? "outdoor" : "indoor"}` : ""}</p></div>
                          {session.status === "completed" ? <Check aria-label="Ukończony" className="size-5 shrink-0 text-emerald-300" /> : null}
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
                          <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="size-3.5" />{session.durationMinutes} min</span>
                          <span>{intensityLabels[session.intensity]}</span>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {session.status !== "completed" ? (
                            <form action={setTrainingSessionStatus}>
                              <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="status" value="completed" />
                              <button className="rounded-lg bg-emerald-400/15 px-3 py-2 text-[11px] font-black text-emerald-200">Wykonane</button>
                            </form>
                          ) : (
                            <form action={setTrainingSessionStatus}>
                              <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="status" value="planned" />
                              <button aria-label="Cofnij ukończenie" className="rounded-lg border border-white/10 p-2 text-white/40"><RotateCcw aria-hidden="true" className="size-3.5" /></button>
                            </form>
                          )}
                          {session.status === "planned" ? (
                            <form action={setTrainingSessionStatus}>
                              <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="status" value="skipped" />
                              <button className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/40">Pomiń</button>
                            </form>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </article>
                ))
              )}
            </div>
          </section>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-white/30">
          <ShieldCheck aria-hidden="true" className="size-4 text-emerald-300/60" /> Dane zapisują się w prywatnej przestrzeni Supabase.
        </p>
      </div>
    </main>
  );
}
