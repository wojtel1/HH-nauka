"use client";

import {
  Activity,
  BarChart3,
  Bike,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  CirclePlus,
  Clock3,
  Cloud,
  Dumbbell,
  Footprints,
  Gauge,
  LogOut,
  Mountain,
  Pencil,
  Plus,
  RotateCcw,
  Route,
  Settings2,
  ShieldCheck,
  Sparkles,
} from "lucide-react";
import { useActionState, useMemo, useState } from "react";

import {
  addProfile,
  completeTrainingSession,
  createProgram,
  createTrainingSession,
  endTrainingProgram,
  generateTrainingWeek,
  setTrainingSessionStatus,
  signOut,
  updateTrainingProgram,
  updateTrainingSession,
  type CloudActionState,
} from "@/app/cloud/actions";
import { addDaysISO, getWeekDates, startOfWeekISO } from "@/lib/training-calendar";
import { buildWeeklyTrainingReport } from "@/lib/training-report";

import { TrainingTrends } from "./training-trends";
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

const statusLabels: Record<CloudSession["status"], string> = {
  planned: "Zaplanowany",
  completed: "Wykonany",
  skipped: "Pominięty",
  cancelled: "Anulowany",
};

const dayFormatter = new Intl.DateTimeFormat("pl-PL", {
  weekday: "long",
  day: "numeric",
  month: "long",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function dateFromISO(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

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

function SessionEditor({ session }: { session: CloudSession }) {
  const [state, action, pending] = useActionState(
    updateTrainingSession,
    initialActionState,
  );

  return (
    <details className="group mt-3 border-t border-white/8 pt-3">
      <summary className="inline-flex cursor-pointer list-none items-center gap-1.5 rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/45 hover:bg-white/5 hover:text-white/70">
        <Pencil aria-hidden="true" className="size-3.5" /> Edytuj
      </summary>
      <form action={action} className="mt-3 space-y-3 rounded-xl bg-black/15 p-3">
        <input type="hidden" name="sessionId" value={session.id} />
        <input
          className={fieldClass}
          name="title"
          required
          maxLength={160}
          defaultValue={session.title}
          aria-label="Nazwa treningu"
        />
        <input
          className={fieldClass}
          name="subtitle"
          maxLength={160}
          defaultValue={session.subtitle ?? ""}
          placeholder="Opis (opcjonalnie)"
          aria-label="Opis treningu"
        />
        <div className="grid grid-cols-2 gap-2">
          <input
            className={fieldClass}
            name="scheduledFor"
            type="date"
            defaultValue={session.scheduledFor}
            required
            aria-label="Data treningu"
          />
          <input
            className={fieldClass}
            name="durationMinutes"
            type="number"
            min={1}
            max={1440}
            defaultValue={session.durationMinutes}
            required
            aria-label="Czas w minutach"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select className={fieldClass} name="kind" defaultValue={session.kind} aria-label="Rodzaj treningu">
            <option value="cycling">Rower</option><option value="walking">Spacer</option><option value="hiking">Hike</option><option value="strength">Siła</option><option value="mobility">Mobilność</option><option value="recovery">Regeneracja</option>
          </select>
          <select className={fieldClass} name="environment" defaultValue={session.environment ?? "outdoor"} aria-label="Środowisko treningu">
            <option value="outdoor">Na zewnątrz</option><option value="indoor">Wewnątrz</option>
          </select>
        </div>
        <select className={fieldClass} name="intensity" defaultValue={session.intensity} aria-label="Intensywność treningu">
          <option value="easy">Lekki</option><option value="moderate">Umiarkowany</option><option value="hard">Mocny</option>
        </select>
        <ActionMessage state={state} />
        <button disabled={pending} className="w-full rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-[#102019] disabled:opacity-50">
          {pending ? "Zapisywanie…" : "Zapisz zmiany"}
        </button>
      </form>
    </details>
  );
}

function CompletionForm({ session }: { session: CloudSession }) {
  const [state, action, pending] = useActionState(
    completeTrainingSession,
    initialActionState,
  );
  const isCompleted = session.status === "completed";

  return (
    <details className="mt-3 rounded-xl bg-emerald-400/[.06]">
      <summary className="cursor-pointer list-none rounded-xl px-3 py-2.5 text-[11px] font-black text-emerald-200 hover:bg-emerald-400/10">
        {isCompleted ? "Edytuj wynik treningu" : "Zakończ i zapisz wynik"}
      </summary>
      <form action={action} className="space-y-3 border-t border-emerald-300/10 p-3">
        <input type="hidden" name="sessionId" value={session.id} />
        <div className="grid grid-cols-2 gap-2">
          <label className="text-[10px] font-bold text-white/45">
            Dystans (km)
            <input className={`${fieldClass} mt-1`} name="distanceKm" type="number" min={0} max={10000} step="0.01" defaultValue={session.metrics.distanceKm ?? ""} placeholder="np. 32,5" />
          </label>
          <label className="text-[10px] font-bold text-white/45">
            Przewyższenie (m)
            <input className={`${fieldClass} mt-1`} name="elevationMeters" type="number" min={0} max={20000} step="1" defaultValue={session.metrics.elevationMeters ?? ""} placeholder="np. 420" />
          </label>
        </div>
        <label className="block text-[10px] font-bold text-white/45">
          Odczuwany wysiłek (1–10)
          <input className={`${fieldClass} mt-1`} name="perceivedEffort" type="number" min={1} max={10} step="1" defaultValue={session.metrics.perceivedEffort ?? ""} placeholder="np. 6" />
        </label>
        <label className="block text-[10px] font-bold text-white/45">
          Notatka po treningu
          <textarea className={`${fieldClass} mt-1`} name="notes" maxLength={1000} rows={3} defaultValue={session.metrics.notes} placeholder="Jak się czułeś? Co warto zapamiętać?" />
        </label>
        <ActionMessage state={state} />
        <button disabled={pending} className="w-full rounded-xl bg-emerald-400 px-4 py-3 text-sm font-black text-[#102019] disabled:opacity-50">
          {pending ? "Zapisywanie…" : isCompleted ? "Zapisz poprawiony wynik" : "Oznacz jako wykonany"}
        </button>
      </form>
    </details>
  );
}

function SessionCard({ session }: { session: CloudSession }) {
  const isCompleted = session.status === "completed";
  const isInactive = session.status === "skipped" || session.status === "cancelled";

  return (
    <article className={`rounded-2xl border p-3 sm:p-4 ${
      isCompleted
        ? "border-emerald-300/15 bg-emerald-300/[.05]"
        : isInactive
          ? "border-white/5 bg-black/10 opacity-65"
          : "border-white/8 bg-black/10"
    }`}>
      <div className="flex items-start gap-3">
        <span className={`grid size-10 shrink-0 place-items-center rounded-xl ${isCompleted ? "bg-emerald-300/15 text-emerald-300" : "bg-orange-300/10 text-orange-300"}`}>
          <KindIcon kind={session.kind} />
        </span>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="font-black leading-5">{session.title}</p>
              {session.subtitle ? <p className="mt-1 text-xs text-white/45">{session.subtitle}</p> : null}
              <p className="mt-1 text-[11px] text-white/35">
                {kindLabels[session.kind]}{session.environment ? ` · ${session.environment === "outdoor" ? "outdoor" : "indoor"}` : ""}
              </p>
            </div>
            {isCompleted ? <Check aria-label="Ukończony" className="size-5 shrink-0 text-emerald-300" /> : null}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-white/45">
            <span className="inline-flex items-center gap-1"><Clock3 aria-hidden="true" className="size-3.5" />{session.durationMinutes} min</span>
            <span>{intensityLabels[session.intensity]}</span>
            {session.status !== "planned" ? <span className="rounded-full bg-white/5 px-2 py-1">{statusLabels[session.status]}</span> : null}
          </div>
          {isCompleted && (session.metrics.distanceKm !== null || session.metrics.elevationMeters !== null || session.metrics.perceivedEffort !== null) ? (
            <div className="mt-3 flex flex-wrap gap-2 text-[11px] font-bold text-emerald-100/70">
              {session.metrics.distanceKm !== null ? <span>{session.metrics.distanceKm.toLocaleString("pl-PL", { maximumFractionDigits: 2 })} km</span> : null}
              {session.metrics.elevationMeters !== null ? <span>↗ {session.metrics.elevationMeters.toLocaleString("pl-PL")} m</span> : null}
              {session.metrics.perceivedEffort !== null ? <span>RPE {session.metrics.perceivedEffort}/10</span> : null}
            </div>
          ) : null}
          {isCompleted && session.metrics.notes ? <p className="mt-3 rounded-lg bg-black/10 px-3 py-2 text-xs leading-5 text-white/45">{session.metrics.notes}</p> : null}
          <div className="mt-3 flex gap-2">
            {isCompleted ? (
              <form action={setTrainingSessionStatus}>
                <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="status" value="planned" />
                <button aria-label="Cofnij ukończenie" className="rounded-lg border border-white/10 p-2 text-white/40"><RotateCcw aria-hidden="true" className="size-3.5" /></button>
              </form>
            ) : null}
            {session.status === "planned" ? (
              <form action={setTrainingSessionStatus}>
                <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="status" value="skipped" />
                <button className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/40">Pomiń</button>
              </form>
            ) : null}
            {isInactive ? (
              <form action={setTrainingSessionStatus}>
                <input type="hidden" name="sessionId" value={session.id} /><input type="hidden" name="status" value="planned" />
                <button className="rounded-lg border border-white/10 px-3 py-2 text-[11px] font-bold text-white/50">Przywróć</button>
              </form>
            ) : null}
          </div>
          {session.status !== "cancelled" ? <CompletionForm session={session} /> : null}
          <SessionEditor session={session} />
        </div>
      </div>
    </article>
  );
}

export function CloudDashboard({ data, householdId, today }: CloudDashboardProps) {
  const [selectedProfileId, setSelectedProfileId] = useState(data.profiles[0]?.id ?? "");
  const [weekStart, setWeekStart] = useState(startOfWeekISO(today));
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
  const [programEditState, programEditAction, programEditPending] = useActionState(
    updateTrainingProgram,
    initialActionState,
  );
  const [generatorState, generatorAction, generatorPending] = useActionState(
    generateTrainingWeek,
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
  const weekDates = useMemo(() => getWeekDates(weekStart), [weekStart]);
  const currentWeekStart = startOfWeekISO(today);
  const weeklyTarget = activeProgram?.sessionsPerWeek
    ?? sessions.filter((session) => weekDates.includes(session.scheduledFor)).length;
  const weeklyReport = buildWeeklyTrainingReport(sessions, weekDates, weeklyTarget);
  const completed = sessions.filter((session) => session.status === "completed");
  const planned = sessions.filter((session) => session.status === "planned");
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
            <p className="mt-2 text-2xl font-black">{planned.length}</p>
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

        <TrainingTrends
          sessions={sessions}
          targetSessions={activeProgram?.sessionsPerWeek ?? 0}
          today={today}
        />

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

                <details className="mt-4 border-t border-white/8 pt-4">
                  <summary className="inline-flex cursor-pointer list-none items-center gap-2 text-xs font-black text-white/45 hover:text-white/70">
                    <Settings2 aria-hidden="true" className="size-4" /> Edytuj program i cel
                  </summary>
                  <form action={programEditAction} className="mt-3 space-y-3 rounded-xl bg-black/15 p-3">
                    <input type="hidden" name="programId" value={activeProgram.id} />
                    <input className={fieldClass} name="title" required maxLength={120} defaultValue={activeProgram.title} aria-label="Nazwa programu" />
                    <textarea className={fieldClass} name="goal" maxLength={240} defaultValue={activeProgram.goal} rows={3} aria-label="Cel programu" />
                    <div className="grid grid-cols-2 gap-2">
                      <label className="text-[10px] font-bold text-white/45">Tygodnie<input className={`${fieldClass} mt-1`} name="weeks" type="number" min={1} max={104} defaultValue={activeProgram.weeks} required /></label>
                      <label className="text-[10px] font-bold text-white/45">Sesje / tydz.<input className={`${fieldClass} mt-1`} name="sessionsPerWeek" type="number" min={1} max={14} defaultValue={activeProgram.sessionsPerWeek} required /></label>
                    </div>
                    <ActionMessage state={programEditState} />
                    <button disabled={programEditPending} className="w-full rounded-xl bg-white/10 px-4 py-3 text-sm font-black text-white/80 disabled:opacity-50">
                      {programEditPending ? "Zapisywanie…" : "Zapisz program"}
                    </button>
                  </form>
                </details>

                <div className="mt-4 rounded-2xl border border-orange-300/15 bg-orange-300/[.05] p-3">
                  <div className="flex items-start gap-2">
                    <Sparkles aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-orange-300" />
                    <div>
                      <p className="text-xs font-black text-orange-100">Automatyczny plan tygodnia</p>
                      <p className="mt-1 text-[10px] leading-4 text-white/35">Generator użyje celu {activeProgram.sessionsPerWeek} sesji i nie zmieni tygodnia, który ma już treningi.</p>
                    </div>
                  </div>
                  <form action={generatorAction} className="mt-3 space-y-2">
                    <input type="hidden" name="profileId" value={profile.id} />
                    <input type="hidden" name="programId" value={activeProgram.id} />
                    <label className="block text-[10px] font-bold text-white/45">
                      Tydzień rozpoczynający się
                      <input className={`${fieldClass} mt-1`} name="weekStart" type="date" value={weekStart} onChange={(event) => { if (event.target.value) setWeekStart(startOfWeekISO(event.target.value)); }} required />
                    </label>
                    <select className={fieldClass} name="focus" defaultValue="balanced" aria-label="Kierunek automatycznego planu">
                      <option value="balanced">Plan zbalansowany</option>
                      <option value="cycling">Priorytet rowerowy</option>
                      <option value="outdoor">Więcej aktywności outdoor</option>
                      <option value="recovery">Lekki tydzień regeneracyjny</option>
                    </select>
                    <ActionMessage state={generatorState} />
                    <button disabled={generatorPending} className="w-full rounded-xl bg-orange-400 px-4 py-3 text-sm font-black text-[#102019] disabled:opacity-50">
                      {generatorPending ? "Układanie planu…" : "Wygeneruj ten tydzień"}
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

            <div className="mt-5 rounded-2xl border border-white/8 bg-black/10 p-3">
              <div className="flex items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setWeekStart((value) => addDaysISO(value, -7))}
                  aria-label="Poprzedni tydzień"
                  className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/55 hover:bg-white/5"
                >
                  <ChevronLeft aria-hidden="true" className="size-4" />
                </button>
                <div className="text-center">
                  <p className="inline-flex items-center gap-1.5 text-xs font-black text-white/75">
                    <CalendarDays aria-hidden="true" className="size-4 text-orange-300" />
                    {shortDateFormatter.format(dateFromISO(weekDates[0]))} – {shortDateFormatter.format(dateFromISO(weekDates[6]))}
                  </p>
                  {weekStart !== currentWeekStart ? (
                    <button type="button" onClick={() => setWeekStart(currentWeekStart)} className="mt-1 block w-full text-[10px] font-bold text-orange-300/80">
                      Wróć do bieżącego tygodnia
                    </button>
                  ) : <p className="mt-1 text-[10px] text-white/30">Bieżący tydzień</p>}
                </div>
                <button
                  type="button"
                  onClick={() => setWeekStart((value) => addDaysISO(value, 7))}
                  aria-label="Następny tydzień"
                  className="grid size-9 place-items-center rounded-xl border border-white/10 text-white/55 hover:bg-white/5"
                >
                  <ChevronRight aria-hidden="true" className="size-4" />
                </button>
              </div>
              <div className="mt-3 grid grid-cols-7 gap-1" aria-label="Podsumowanie tygodnia">
                {weekDates.map((date) => {
                  const daySessions = sessions.filter((session) => session.scheduledFor === date);
                  return (
                    <div key={date} className={`rounded-lg px-1 py-2 text-center ${date === today ? "bg-orange-300/15 text-orange-200" : "bg-white/[.03] text-white/40"}`}>
                      <p className="text-[9px] font-black uppercase">{dayFormatter.format(dateFromISO(date)).slice(0, 2)}</p>
                      <p className="mt-0.5 text-xs font-black">{date.slice(-2)}</p>
                      <span className={`mx-auto mt-1 block size-1.5 rounded-full ${daySessions.length > 0 ? "bg-orange-300" : "bg-white/10"}`} />
                    </div>
                  );
                })}
              </div>
            </div>

            <section className="mt-4 rounded-2xl border border-orange-300/10 bg-orange-300/[.04] p-4" aria-label="Raport tygodniowy">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[.16em] text-orange-300/70">Raport tygodniowy</p>
                  <h3 className="mt-1 text-base font-black">{weeklyReport.completed} z {weeklyTarget || 0} treningów celu</h3>
                </div>
                <span className="grid size-10 place-items-center rounded-xl bg-orange-300/10 text-orange-300">
                  <BarChart3 aria-hidden="true" className="size-5" />
                </span>
              </div>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
                <div className="h-full rounded-full bg-orange-400 transition-[width]" style={{ width: `${weeklyReport.targetProgressPercent}%` }} />
              </div>
              <p className="mt-2 text-[10px] text-white/35">
                Realizacja celu: {weeklyReport.targetProgressPercent}% · zaplanowane {weeklyReport.scheduled} · pominięte {weeklyReport.skipped}
              </p>
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                <div className="rounded-xl bg-black/15 p-3">
                  <p className="text-[10px] text-white/35">Aktywny czas</p>
                  <p className="mt-1 text-sm font-black">{Math.floor(weeklyReport.completedMinutes / 60)}h {weeklyReport.completedMinutes % 60}m</p>
                </div>
                <div className="rounded-xl bg-black/15 p-3">
                  <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Route aria-hidden="true" className="size-3" /> Dystans</p>
                  <p className="mt-1 text-sm font-black">{weeklyReport.distanceKm.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} km</p>
                </div>
                <div className="rounded-xl bg-black/15 p-3">
                  <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Mountain aria-hidden="true" className="size-3" /> Przewyższenie</p>
                  <p className="mt-1 text-sm font-black">{weeklyReport.elevationMeters.toLocaleString("pl-PL")} m</p>
                </div>
                <div className="rounded-xl bg-black/15 p-3">
                  <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Gauge aria-hidden="true" className="size-3" /> Śr. wysiłek</p>
                  <p className="mt-1 text-sm font-black">{weeklyReport.averageEffort === null ? "—" : `${weeklyReport.averageEffort.toLocaleString("pl-PL", { maximumFractionDigits: 1 })}/10`}</p>
                </div>
              </div>
            </section>

            <div className="mt-4 space-y-5">
              {sessions.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center">
                  <Cloud aria-hidden="true" className="mx-auto size-7 text-white/20" />
                  <p className="mt-3 text-sm font-bold text-white/55">Brak zapisanych treningów</p>
                  <p className="mt-1 text-xs text-white/30">Dodaj pierwszą jazdę, spacer, hike lub trening siłowy.</p>
                </div>
              ) : (
                weekDates.map((date) => {
                  const daySessions = sessions.filter((session) => session.scheduledFor === date);
                  if (daySessions.length === 0) return null;
                  return (
                    <section key={date} aria-label={dayFormatter.format(dateFromISO(date))}>
                      <div className="mb-2 flex items-center justify-between gap-3">
                        <h3 className="text-xs font-black capitalize text-white/55">{dayFormatter.format(dateFromISO(date))}</h3>
                        {date === today ? <span className="rounded-full bg-orange-300/10 px-2 py-1 text-[9px] font-black uppercase tracking-wider text-orange-200">Dzisiaj</span> : null}
                      </div>
                      <div className="space-y-2">
                        {daySessions.map((session) => <SessionCard key={session.id} session={session} />)}
                      </div>
                    </section>
                  );
                })
              )}
            </div>

            {sessions.length > 0 && !sessions.some((session) => weekDates.includes(session.scheduledFor)) ? (
              <div className="mt-4 rounded-2xl border border-dashed border-white/10 px-4 py-8 text-center">
                <CalendarDays aria-hidden="true" className="mx-auto size-6 text-white/20" />
                <p className="mt-2 text-sm font-bold text-white/50">Brak treningów w tym tygodniu</p>
                <p className="mt-1 text-xs text-white/30">Przejdź do innego tygodnia albo dodaj nowy trening.</p>
              </div>
            ) : null}
          </section>
        </div>

        <p className="mt-5 flex items-center justify-center gap-2 text-center text-[11px] text-white/30">
          <ShieldCheck aria-hidden="true" className="size-4 text-emerald-300/60" /> Dane zapisują się w prywatnej przestrzeni Supabase.
        </p>
      </div>
    </main>
  );
}
