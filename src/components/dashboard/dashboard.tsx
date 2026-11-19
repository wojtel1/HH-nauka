"use client";

import { useEffect, useMemo, useState, type CSSProperties } from "react";
import {
  Activity,
  Apple,
  ArrowUpRight,
  Bike,
  CalendarDays,
  Camera,
  Check,
  ChevronRight,
  Dumbbell,
  Flame,
  Footprints,
  HeartPulse,
  ImagePlus,
  LayoutDashboard,
  Leaf,
  LockKeyhole,
  Menu,
  Mountain,
  Plus,
  Route,
  Salad,
  Settings2,
  ShieldCheck,
  Sparkles,
  Timer,
  Utensils,
  Watch,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import clsx from "clsx";
import {
  createProgramLifecycle,
  endProgram,
  parseProgramLifecycles,
  startProgram,
  type ActiveProgram,
  type ProgramHistoryEntry,
  type ProgramLifecycle,
  type ProgramLifecycleByProfile,
  type ProgramTemplate,
} from "@/lib/program-lifecycle";
import type {
  DashboardData,
  DashboardMetric,
  DashboardProfile,
  DashboardProps,
  DashboardSection,
  DashboardSession,
  IntegrationKind,
  SessionKind,
} from "./types";

const sectionItems: Array<{
  id: DashboardSection;
  label: string;
  icon: LucideIcon;
}> = [
  { id: "overview", label: "Pulpit", icon: LayoutDashboard },
  { id: "plan", label: "Plan", icon: CalendarDays },
  { id: "nutrition", label: "Dieta", icon: Salad },
  { id: "progress", label: "Postępy", icon: Activity },
];

const kindConfig: Record<
  SessionKind,
  { icon: LucideIcon; label: string; className: string }
> = {
  rouvy: {
    icon: Bike,
    label: "Rouvy",
    className: "bg-orange-400/15 text-orange-300 ring-orange-300/20",
  },
  cycling: {
    icon: Route,
    label: "Rower",
    className: "bg-lime-400/15 text-lime-300 ring-lime-300/20",
  },
  "outdoor-cycling": {
    icon: Bike,
    label: "Rower outdoor",
    className: "bg-amber-400/15 text-amber-300 ring-amber-300/20",
  },
  strength: {
    icon: Dumbbell,
    label: "Siła",
    className: "bg-sky-400/15 text-sky-300 ring-sky-300/20",
  },
  recovery: {
    icon: HeartPulse,
    label: "Regeneracja",
    className: "bg-emerald-400/15 text-emerald-300 ring-emerald-300/20",
  },
  mobility: {
    icon: Footprints,
    label: "Mobilność",
    className: "bg-violet-400/15 text-violet-300 ring-violet-300/20",
  },
  walking: {
    icon: Footprints,
    label: "Spacer",
    className: "bg-teal-400/15 text-teal-300 ring-teal-300/20",
  },
  hiking: {
    icon: Mountain,
    label: "Hike",
    className: "bg-yellow-400/15 text-yellow-300 ring-yellow-300/20",
  },
};

const integrationIcons: Record<IntegrationKind, LucideIcon> = {
  garmin: Watch,
  samsung: HeartPulse,
  apple: Apple,
  manual: Activity,
};

const PROGRAM_STORAGE_KEY = "trailvelo-program-lifecycle-v1";

const programCatalog: ProgramTemplate[] = [
  {
    id: "balanced-base-6",
    title: "Baza outdoor i regularność · 6 tygodni",
    goal: "Rower na zewnątrz, spacery i hike uzupełniają spokojne budowanie wytrzymałości",
    weeks: 6,
  },
  {
    id: "strength-mobility-8",
    title: "Siła i mobilność · 8 tygodni",
    goal: "Więcej siły całego ciała bez pomijania regeneracji",
    weeks: 8,
  },
  {
    id: "cycling-power-4",
    title: "Moc na rowerze · 4 tygodnie",
    goal: "Kontrolowany rozwój mocy progowej przed kolejnym blokiem",
    weeks: 4,
  },
];

function createFallbackData(profile: DashboardProfile): DashboardData {
  const isMaja = profile.name.toLocaleLowerCase("pl").includes("maja");
  const isKasia = profile.name.toLocaleLowerCase("pl").includes("kasia");

  return {
    weekLabel: "18–24 listopada",
    programId: isMaja ? "full-body-strength" : "ftp-builder",
    programName: isMaja ? "Siła • pełne ciało" : "FTP Builder • tydzień 2/4",
    programSubtitle: isMaja
      ? "Trzy sesje z progresją ciężaru"
      : "Równowaga między mocą, siłą i regeneracją",
    programProgress: isMaja ? 42 : 58,
    programWeeks: isMaja ? 8 : 4,
    programCurrentWeek: isMaja ? 3 : 2,
    metrics: [
      {
        id: "sessions",
        label: "Sesje w tygodniu",
        value: isMaja ? "2 / 3" : "4 / 6",
        helper: isMaja ? "Jedna sesja do celu" : "Dwie sesje przed Tobą",
        trend: "+1 vs poprzedni tydzień",
        tone: "orange",
      },
      {
        id: "active-time",
        label: "Czas aktywny",
        value: isMaja ? "2 h 10 min" : "5 h 35 min",
        helper: "Cel: 7 godzin",
        tone: "green",
      },
      {
        id: "load",
        label: isMaja ? "Objętość siłowa" : "Obciążenie",
        value: isMaja ? "8 420 kg" : "286 TSS",
        helper: "Strefa optymalna",
        trend: "+8%",
        tone: "blue",
      },
      {
        id: "streak",
        label: "Regularność",
        value: "12 dni",
        helper: "Najlepsza seria: 19 dni",
        tone: "stone",
      },
    ],
    sessions: isMaja
      ? [
          {
            id: "m-1",
            day: "Pon",
            date: "18.11",
            title: "Dół ciała • progresja",
            subtitle: "Przysiad, hip thrust, RDL",
            duration: "65 min",
            kind: "strength",
            intensity: "mocny",
            completed: true,
          },
          {
            id: "m-2",
            day: "Śro",
            date: "20.11",
            title: "Mobilność i core",
            subtitle: "Biodra, odcinek piersiowy, brzuch",
            duration: "30 min",
            kind: "mobility",
            intensity: "lekki",
            completed: true,
          },
          {
            id: "m-3",
            day: "Pią",
            date: "22.11",
            title: "Góra ciała • siła",
            subtitle: "Wyciskanie, wiosłowanie, barki",
            duration: "60 min",
            kind: "strength",
            intensity: "umiarkowany",
            completed: false,
          },
          {
            id: "m-4",
            day: "Nie",
            date: "24.11",
            title: "Spacer regeneracyjny",
            subtitle: "Swobodne tempo i świeże powietrze",
            duration: "40 min",
            kind: "recovery",
            intensity: "lekki",
            completed: false,
          },
        ]
      : [
          {
            id: "w-1",
            day: "Pon",
            date: "18.11",
            title: "Tempo Foundation",
            subtitle: "Rouvy • FTP Builder",
            duration: "55 min",
            kind: "rouvy",
            intensity: "umiarkowany",
            completed: true,
          },
          {
            id: "w-2",
            day: "Wto",
            date: "19.11",
            title: "Góra ciała + core",
            subtitle: "Siłownia • 6 ćwiczeń",
            duration: "50 min",
            kind: "strength",
            intensity: "umiarkowany",
            completed: true,
          },
          {
            id: "w-3",
            day: "Czw",
            date: "21.11",
            title: "Over / Under Intervals",
            subtitle: "Rouvy • kluczowa sesja tygodnia",
            duration: "70 min",
            kind: "rouvy",
            intensity: "mocny",
            completed: false,
          },
          {
            id: "w-4",
            day: "Pią",
            date: "22.11",
            title: "Mobilność + oddech",
            subtitle: "Regeneracja po interwałach",
            duration: "25 min",
            kind: "mobility",
            intensity: "lekki",
            completed: false,
          },
          {
            id: "w-5",
            day: "Nie",
            date: "24.11",
            title: "Endurance Ride",
            subtitle: "Spokojna baza tlenowa",
            duration: "90 min",
            kind: "cycling",
            intensity: "umiarkowany",
            completed: false,
          },
        ],
    nutrition: {
      consumed: isMaja ? 1430 : 1840,
      goal: isMaja ? 2100 : 2450,
      protein: { value: isMaja ? 92 : 118, goal: isMaja ? 120 : 150 },
      carbohydrates: { value: isMaja ? 164 : 214, goal: isMaja ? 250 : 310 },
      fats: { value: isMaja ? 52 : 61, goal: isMaja ? 70 : 80 },
    },
    integrations: [
      isKasia
        ? {
            id: "samsung-health",
            kind: "samsung",
            name: "Samsung Health",
            status: "available",
            detail: "Health Connect • wersja sklepowa",
          }
        : isMaja
          ? {
              id: "apple-health",
              kind: "apple",
              name: "Apple Health",
              status: "available",
              detail: "HealthKit • wersja na iPhone",
            }
          : {
              id: "garmin-connect",
              kind: "garmin",
              name: "Garmin Connect",
              status: "connected",
              detail: "Synchronizacja dzisiaj, 07:42",
            },
      {
        id: "manual-import",
        kind: "manual",
        name: isMaja ? "Dziennik siłowy" : "Import FIT",
        status: "manual",
        detail: isMaja ? "Wpisy ręczne są aktywne" : "Zawsze dostępny fallback",
      },
    ],
    progress: [
      { label: "T1", training: 58, recovery: 72 },
      { label: "T2", training: 68, recovery: 69 },
      { label: "T3", training: 63, recovery: 78 },
      { label: "T4", training: 76, recovery: 74 },
      { label: "T5", training: 82, recovery: 81 },
      { label: "T6", training: 88, recovery: 79 },
    ],
    quote: isMaja
      ? "Siła rośnie tam, gdzie konsekwencja spotyka cierpliwość."
      : "Każdy podjazd zaczyna się od pierwszego obrotu korby.",
  };
}

function MetricIcon({ metric }: { metric: DashboardMetric }) {
  const icons: Record<DashboardMetric["tone"], LucideIcon> = {
    orange: Flame,
    green: Timer,
    blue: Zap,
    stone: Sparkles,
  };
  const Icon = icons[metric.tone];
  return <Icon aria-hidden="true" className="size-4" />;
}

function BrandMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="relative grid size-11 shrink-0 place-items-center overflow-hidden rounded-2xl bg-[linear-gradient(145deg,#f89b3c,#d9671f)] text-[#11251d] shadow-[0_12px_30px_rgba(235,119,38,.25)]">
        <Mountain aria-hidden="true" className="absolute size-8 -translate-y-0.5 opacity-35" />
        <Bike aria-hidden="true" className="relative size-6" />
      </div>
      {!compact && (
        <div>
          <p className="text-[10px] font-semibold uppercase tracking-[0.24em] text-orange-300">
            Family training
          </p>
          <p className="text-lg font-black tracking-tight text-white">TrailVelo</p>
        </div>
      )}
    </div>
  );
}

function Sidebar({
  active,
  onChange,
  profile,
  onSwitchProfile,
  onLock,
}: {
  active: DashboardSection;
  onChange: (section: DashboardSection) => void;
  profile: DashboardProfile;
  onSwitchProfile?: () => void;
  onLock?: () => void;
}) {
  return (
    <aside className="sticky top-0 hidden h-dvh w-[248px] shrink-0 flex-col border-r border-white/7 bg-[#0b1813]/95 px-5 py-6 backdrop-blur-xl lg:flex">
      <BrandMark />

      <nav aria-label="Główna nawigacja" className="mt-10 space-y-1.5">
        {sectionItems.map((item) => {
          const Icon = item.icon;
          const selected = active === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onChange(item.id)}
              aria-current={selected ? "page" : undefined}
              className={clsx(
                "group flex w-full items-center gap-3 rounded-2xl px-3.5 py-3 text-sm font-semibold transition",
                selected
                  ? "bg-white/10 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,.07)]"
                  : "text-white/55 hover:bg-white/5 hover:text-white",
              )}
            >
              <span
                className={clsx(
                  "grid size-8 place-items-center rounded-xl transition",
                  selected
                    ? "bg-orange-400 text-[#102019]"
                    : "bg-white/5 text-white/60 group-hover:text-white",
                )}
              >
                <Icon aria-hidden="true" className="size-4" />
              </span>
              {item.label}
            </button>
          );
        })}
      </nav>

      <div className="mt-auto space-y-3">
        <div className="rounded-3xl border border-white/8 bg-[linear-gradient(160deg,rgba(74,112,85,.28),rgba(20,39,31,.4))] p-4">
          <div className="mb-3 flex items-center gap-2 text-xs font-semibold text-emerald-200">
            <ShieldCheck aria-hidden="true" className="size-4" />
            Profil prywatny
          </div>
          <p className="text-xs leading-5 text-white/48">
            Rodzina widzi tylko dane, które świadomie udostępnisz.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-white/8 bg-white/[.035] p-2">
          <button
            type="button"
            onClick={onSwitchProfile}
            className="flex min-w-0 flex-1 items-center gap-3 rounded-xl p-1.5 text-left transition hover:bg-white/5"
            aria-label="Przełącz profil"
          >
            <ProfileAvatar profile={profile} size="sm" />
            <span className="min-w-0">
              <span className="block truncate text-sm font-bold text-white">
                {profile.name}
              </span>
              <span className="block truncate text-[11px] text-white/40">
                {profile.role}
              </span>
            </span>
          </button>
          <button
            type="button"
            onClick={onLock}
            className="grid size-9 place-items-center rounded-xl text-white/40 transition hover:bg-white/8 hover:text-white"
            aria-label="Zablokuj profil"
          >
            <LockKeyhole aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}

function ProfileAvatar({
  profile,
  size = "md",
}: {
  profile: DashboardProfile;
  size?: "sm" | "md";
}) {
  return profile.avatarUrl ? (
    // User-selected image URLs are expected to be sanitized/signed by the backend.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={profile.avatarUrl}
      alt=""
      className={clsx(
        "rounded-2xl object-cover ring-1 ring-white/15",
        size === "sm" ? "size-10" : "size-12",
      )}
    />
  ) : (
    <span
      aria-hidden="true"
      className={clsx(
        "grid place-items-center rounded-2xl font-black text-[#102019] ring-1 ring-white/15",
        size === "sm" ? "size-10 text-sm" : "size-12 text-base",
      )}
      style={{ background: profile.accent }}
    >
      {profile.initials}
    </span>
  );
}

function Topbar({
  profile,
  onMenu,
  onSwitchProfile,
}: {
  profile: DashboardProfile;
  onMenu: () => void;
  onSwitchProfile?: () => void;
}) {
  return (
    <header className="flex items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3 lg:hidden">
        <button
          type="button"
          onClick={onMenu}
          className="grid size-11 place-items-center rounded-2xl border border-white/10 bg-white/5 text-white"
          aria-label="Otwórz menu"
        >
          <Menu aria-hidden="true" className="size-5" />
        </button>
        <BrandMark compact />
      </div>

      <div className="hidden lg:block">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/35">
          Czwartek, 19 listopada
        </p>
        <p className="mt-1 text-sm text-white/55">Dobrze Cię widzieć, {profile.name}.</p>
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <button
          type="button"
          className="hidden items-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs font-semibold text-white/70 transition hover:bg-white/8 sm:flex"
          aria-label="Ustawienia aplikacji"
        >
          <Settings2 aria-hidden="true" className="size-4" />
          Ustawienia
        </button>
        <button
          type="button"
          onClick={onSwitchProfile}
          className="flex items-center gap-2 rounded-2xl border border-white/10 bg-white/5 p-1.5 pr-2.5 transition hover:bg-white/8"
          aria-label={`Aktywny profil: ${profile.name}. Przełącz profil`}
        >
          <ProfileAvatar profile={profile} size="sm" />
          <ChevronRight aria-hidden="true" className="size-4 text-white/35" />
        </button>
      </div>
    </header>
  );
}

function Hero({
  profile,
  data,
  onQuickAdd,
}: {
  profile: DashboardProfile;
  data: DashboardData;
  onQuickAdd: () => void;
}) {
  return (
    <section className="relative isolate overflow-hidden rounded-[2rem] border border-white/10 bg-[#173328] px-5 py-6 shadow-[0_28px_80px_rgba(0,0,0,.28)] sm:px-8 sm:py-8">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-20 opacity-60"
        style={{
          background:
            "radial-gradient(circle at 78% 18%, rgba(244,146,62,.42), transparent 22%), linear-gradient(120deg, #17382c 0%, #11241c 52%, #0b1713 100%)",
        }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10 opacity-[.16]"
        style={{
          backgroundImage:
            "repeating-radial-gradient(ellipse at 78% 120%, transparent 0 22px, rgba(255,255,255,.7) 23px 24px, transparent 25px 39px)",
        }}
      />
      <Mountain
        aria-hidden="true"
        className="absolute -bottom-12 right-[-2rem] -z-10 size-72 text-white/[.055] sm:size-96"
        strokeWidth={0.7}
      />
      <Bike
        aria-hidden="true"
        className="absolute bottom-5 right-7 hidden size-24 -rotate-6 text-orange-300/25 sm:block lg:size-32"
        strokeWidth={0.8}
      />

      <div className="relative max-w-2xl">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-orange-200/15 bg-orange-300/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-[0.16em] text-orange-200">
          <Leaf aria-hidden="true" className="size-3.5" />
          {data.weekLabel}
        </div>
        <p className="text-sm font-semibold text-white/52">{profile.greeting ?? "Twój rytm. Twój szlak."}</p>
        <h1 className="mt-2 max-w-xl text-3xl font-black leading-[1.05] tracking-[-0.04em] text-white sm:text-5xl">
          Gotowi na kolejny
          <span className="text-orange-300"> dobry tydzień?</span>
        </h1>
        <p className="mt-4 max-w-lg text-sm leading-6 text-white/58 sm:text-base">
          {data.quote} Plan dopasowuje trening, regenerację i codzienne życie — Ty decydujesz o tempie.
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="button"
            onClick={onQuickAdd}
            className="inline-flex items-center gap-2 rounded-2xl bg-orange-400 px-4 py-3 text-sm font-extrabold text-[#15221b] shadow-[0_14px_30px_rgba(239,132,47,.28)] transition hover:-translate-y-0.5 hover:bg-orange-300"
          >
            <Plus aria-hidden="true" className="size-4" />
            Dodaj aktywność
          </button>
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded-2xl border border-white/14 bg-white/7 px-4 py-3 text-sm font-bold text-white/78 transition hover:bg-white/12"
          >
            Zobacz plan
            <ArrowUpRight aria-hidden="true" className="size-4" />
          </button>
        </div>
      </div>
    </section>
  );
}

function Metrics({ metrics }: { metrics: DashboardMetric[] }) {
  const toneClasses: Record<DashboardMetric["tone"], string> = {
    orange: "bg-orange-400/12 text-orange-300",
    green: "bg-emerald-400/12 text-emerald-300",
    blue: "bg-sky-400/12 text-sky-300",
    stone: "bg-stone-300/10 text-stone-200",
  };

  return (
    <section aria-label="Najważniejsze statystyki" className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {metrics.map((metric) => (
        <article
          key={metric.id}
          className="rounded-[1.6rem] border border-white/8 bg-white/[.035] p-4 transition hover:border-white/14 hover:bg-white/[.055] sm:p-5"
        >
          <div className="flex items-start justify-between gap-3">
            <span className={clsx("grid size-9 place-items-center rounded-xl", toneClasses[metric.tone])}>
              <MetricIcon metric={metric} />
            </span>
            {metric.trend && (
              <span className="rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
                {metric.trend}
              </span>
            )}
          </div>
          <p className="mt-4 text-[11px] font-bold uppercase tracking-[0.12em] text-white/36">
            {metric.label}
          </p>
          <p className="mt-1 text-xl font-black tracking-tight text-white sm:text-2xl">
            {metric.value}
          </p>
          <p className="mt-1 text-[11px] leading-4 text-white/38">{metric.helper}</p>
        </article>
      ))}
    </section>
  );
}

function SessionRow({
  session,
  onToggle,
}: {
  session: DashboardSession;
  onToggle: (id: string) => void;
}) {
  const config = kindConfig[session.kind];
  const Icon = config.icon;
  return (
    <article
      className={clsx(
        "group flex items-center gap-3 rounded-2xl border p-3.5 transition sm:gap-4",
        session.completed
          ? "border-emerald-300/10 bg-emerald-300/[.025]"
          : "border-white/7 bg-white/[.025] hover:border-white/13 hover:bg-white/[.045]",
      )}
    >
      <div className="w-10 shrink-0 text-center">
        <p className="text-[10px] font-bold uppercase tracking-wider text-white/32">{session.day}</p>
        <p className="mt-0.5 text-xs font-bold text-white/62">{session.date}</p>
      </div>
      <span className={clsx("grid size-10 shrink-0 place-items-center rounded-2xl ring-1", config.className)}>
        <Icon aria-hidden="true" className="size-4.5" />
      </span>
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <h3 className={clsx("truncate text-sm font-bold", session.completed ? "text-white/55 line-through" : "text-white/88")}>
            {session.title}
          </h3>
          {session.intensity && (
            <span className="rounded-full border border-white/7 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-white/34">
              {session.intensity}
            </span>
          )}
        </div>
        <p className="mt-1 truncate text-[11px] text-white/37">{session.subtitle}</p>
      </div>
      <span className="hidden items-center gap-1.5 text-[11px] font-semibold text-white/38 sm:flex">
        <Timer aria-hidden="true" className="size-3.5" />
        {session.duration}
      </span>
      <button
        type="button"
        onClick={() => onToggle(session.id)}
        className={clsx(
          "grid size-9 shrink-0 place-items-center rounded-xl border transition",
          session.completed
            ? "border-emerald-300/25 bg-emerald-300/15 text-emerald-300"
            : "border-white/12 text-white/24 hover:border-orange-300/40 hover:text-orange-300",
        )}
        aria-label={session.completed ? `Oznacz ${session.title} jako niewykonany` : `Oznacz ${session.title} jako wykonany`}
        aria-pressed={session.completed}
      >
        <Check aria-hidden="true" className="size-4" />
      </button>
    </article>
  );
}

function WeeklyPlan({
  sessions,
  onToggle,
}: {
  sessions: DashboardSession[];
  onToggle: (id: string) => void;
}) {
  return (
    <section id="plan-section" className="scroll-mt-5 rounded-[1.8rem] border border-white/8 bg-[#101f19]/78 p-4 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/75">
            Najbliższe sesje
          </p>
          <h2 className="mt-1 text-xl font-black tracking-tight text-white">Plan tygodnia</h2>
        </div>
        <button type="button" className="rounded-xl px-2 py-2 text-xs font-bold text-white/48 transition hover:bg-white/5 hover:text-white">
          Pełny kalendarz
        </button>
      </div>
      <div className="space-y-2">
        {sessions.map((session) => (
          <SessionRow key={session.id} session={session} onToggle={onToggle} />
        ))}
      </div>
    </section>
  );
}

function ProgramCard({
  active,
  historyCount,
  onManage,
}: {
  active: ActiveProgram | null;
  historyCount: number;
  onManage: () => void;
}) {
  return (
    <section className="overflow-hidden rounded-[1.8rem] border border-white/8 bg-[#101f19]/78">
      <div className="relative overflow-hidden p-5">
        <div aria-hidden="true" className="absolute -right-6 -top-8 size-40 rounded-full bg-orange-400/10 blur-3xl" />
        <div className="relative flex items-start justify-between gap-4">
          <span className="grid size-11 place-items-center rounded-2xl bg-orange-400/12 text-orange-300 ring-1 ring-orange-300/15">
            <Bike aria-hidden="true" className="size-5" />
          </span>
          <span className="rounded-full border border-white/8 bg-white/4 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white/45">
            {active ? "Aktywny program" : "Gotowy na zmianę"}
          </span>
        </div>
        <h2 className="relative mt-5 text-lg font-black text-white">
          {active?.title ?? "Brak aktywnego programu"}
        </h2>
        <p className="relative mt-1 text-xs leading-5 text-white/42">
          {active?.goal ?? "Wybierz kolejny program, gdy będziesz gotowy."}
        </p>
        {active ? (
          <div className="relative mt-5">
            <div className="mb-2 flex items-center justify-between text-[10px] font-bold uppercase tracking-wider">
              <span className="text-white/35">Tydzień {active.currentWeek}/{active.weeks}</span>
              <span className="text-orange-300">{active.progressPercent}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-white/6">
              <div
                className="h-full rounded-full bg-[linear-gradient(90deg,#f68b36,#f9b467)] shadow-[0_0_20px_rgba(246,139,54,.35)]"
                style={{ width: `${active.progressPercent}%` }}
              />
            </div>
          </div>
        ) : null}
        {historyCount > 0 ? (
          <p className="relative mt-4 text-[10px] font-bold uppercase tracking-wider text-white/30">
            Historia: {historyCount} {historyCount === 1 ? "program" : "programy"}
          </p>
        ) : null}
      </div>
      <button type="button" onClick={onManage} className="flex w-full items-center justify-between border-t border-white/7 px-5 py-3.5 text-xs font-bold text-white/50 transition hover:bg-white/[.025] hover:text-white">
        {active ? "Szczegóły i zmiana programu" : "Wybierz nowy program"}
        <ChevronRight aria-hidden="true" className="size-4" />
      </button>
    </section>
  );
}

function ProgramManagerDialog({
  active,
  history,
  onClose,
  onEnd,
  onStart,
  open,
}: {
  active: ActiveProgram | null;
  history: ProgramHistoryEntry[];
  onClose: () => void;
  onEnd: (reason: string) => void;
  onStart: (template: ProgramTemplate) => void;
  open: boolean;
}) {
  const [reason, setReason] = useState("");
  const [selectedId, setSelectedId] = useState(programCatalog[0].id);
  if (!open) return null;

  const selectedProgram =
    programCatalog.find((program) => program.id === selectedId) ?? programCatalog[0];

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/70 backdrop-blur-sm sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="program-manager-title" className="max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-t-[2rem] border border-white/10 bg-[#102019] p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/75">Program treningowy</p>
            <h2 id="program-manager-title" className="mt-1 text-2xl font-black text-white">
              {active ? "Twój aktywny program" : "Wybierz kolejny program"}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/5 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Zamknij">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>

        {active ? (
          <div className="mt-6">
            <div className="rounded-3xl border border-orange-300/15 bg-orange-400/[.07] p-5">
              <h3 className="text-lg font-black text-white">{active.title}</h3>
              <p className="mt-1 text-sm leading-6 text-white/50">{active.goal}</p>
              <div className="mt-4 flex items-center justify-between text-xs font-bold text-white/45">
                <span>Tydzień {active.currentWeek} z {active.weeks}</span>
                <span className="text-orange-300">{active.progressPercent}%</span>
              </div>
            </div>
            <div className="mt-5 rounded-3xl border border-white/8 bg-white/[.025] p-5">
              <h3 className="font-black text-white">Chcesz zmienić plan?</h3>
              <p className="mt-1 text-xs leading-5 text-white/45">Dotychczasowy postęp zostanie zachowany w historii. Potem od razu możesz wybrać nowy program.</p>
              <label className="mt-4 block text-xs font-bold text-white/60" htmlFor="program-end-reason">Powód zakończenia (opcjonalnie)</label>
              <textarea id="program-end-reason" value={reason} onChange={(event) => setReason(event.target.value)} maxLength={240} placeholder="Np. zmiana celu, zbyt duże obciążenie…" className="mt-2 min-h-24 w-full resize-none rounded-2xl border border-white/10 bg-black/15 px-4 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-orange-300/50" />
              <button type="button" onClick={() => { onEnd(reason); setReason(""); }} className="sticky bottom-2 z-20 mt-3 w-full rounded-2xl border border-red-300/20 bg-[#3b2d29] px-4 py-3 text-sm font-black text-red-100 shadow-xl transition hover:bg-red-400/15 sm:static">
                Zakończ ten program
              </button>
            </div>
          </div>
        ) : (
          <div className="mt-6">
            <div className="grid gap-2">
              {programCatalog.map((program) => {
                const selected = program.id === selectedId;
                return (
                  <button key={program.id} type="button" aria-pressed={selected} onClick={() => setSelectedId(program.id)} className={clsx("rounded-2xl border p-4 text-left transition", selected ? "border-orange-300/40 bg-orange-400/10" : "border-white/8 bg-white/[.025] hover:bg-white/[.05]")}>
                    <span className="block font-black text-white">{program.title}</span>
                    <span className="mt-1 block text-xs leading-5 text-white/45">{program.goal}</span>
                  </button>
                );
              })}
            </div>
            <button type="button" onClick={() => onStart(selectedProgram)} className="mt-4 w-full rounded-2xl bg-orange-400 px-4 py-3.5 text-sm font-black text-[#102019] transition hover:bg-orange-300">
              Rozpocznij wybrany program
            </button>
          </div>
        )}

        {history.length > 0 ? (
          <div className="mt-6 border-t border-white/8 pt-5">
            <h3 className="text-xs font-black uppercase tracking-wider text-white/40">Ostatnio zakończone</h3>
            <div className="mt-3 space-y-2">
              {history.slice(0, 3).map((entry) => (
                <div key={`${entry.id}-${entry.endedAt}`} className="rounded-2xl bg-white/[.025] px-4 py-3">
                  <p className="text-sm font-bold text-white/70">{entry.title}</p>
                  <p className="mt-1 text-[11px] text-white/35">{entry.progressPercent}% realizacji · {entry.endReason}</p>
                </div>
              ))}
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function NutritionCard({ data }: { data: DashboardData }) {
  const nutrition = data.nutrition;
  const remaining = Math.max(0, nutrition.goal - nutrition.consumed);
  const calorieProgress = Math.min(100, Math.round((nutrition.consumed / nutrition.goal) * 100));
  const macros = [
    { label: "Białko", value: nutrition.protein.value, goal: nutrition.protein.goal, color: "bg-orange-400" },
    { label: "Węgle", value: nutrition.carbohydrates.value, goal: nutrition.carbohydrates.goal, color: "bg-emerald-400" },
    { label: "Tłuszcze", value: nutrition.fats.value, goal: nutrition.fats.goal, color: "bg-sky-400" },
  ];

  return (
    <section id="nutrition-section" className="scroll-mt-5 rounded-[1.8rem] border border-white/8 bg-[#101f19]/78 p-5">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-300/70">Dzisiaj</p>
          <h2 className="mt-1 text-lg font-black text-white">Energia i makro</h2>
        </div>
        <span className="grid size-10 place-items-center rounded-2xl bg-emerald-400/12 text-emerald-300">
          <Utensils aria-hidden="true" className="size-4.5" />
        </span>
      </div>

      <div className="mt-5 flex items-center gap-5">
        <div
          className="grid size-[92px] shrink-0 place-items-center rounded-full"
          style={{ background: `conic-gradient(#f59a45 ${calorieProgress}%, rgba(255,255,255,.06) 0)` }}
        >
          <div className="grid size-[76px] place-items-center rounded-full bg-[#101f19] text-center">
            <span>
              <span className="block text-lg font-black text-white">{remaining}</span>
              <span className="block text-[9px] font-bold uppercase tracking-wider text-white/34">kcal zostało</span>
            </span>
          </div>
        </div>
        <div>
          <p className="text-2xl font-black tracking-tight text-white">
            {nutrition.consumed.toLocaleString("pl-PL")}
            <span className="ml-1 text-xs font-semibold text-white/32">/ {nutrition.goal} kcal</span>
          </p>
          <p className="mt-1 text-xs leading-5 text-white/38">Dobry balans na dzień treningowy.</p>
        </div>
      </div>

      <div className="mt-5 space-y-3">
        {macros.map((macro) => (
          <div key={macro.label}>
            <div className="mb-1.5 flex items-center justify-between text-[10px] font-semibold">
              <span className="text-white/45">{macro.label}</span>
              <span className="text-white/65">{macro.value} / {macro.goal} g</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-white/6">
              <div className={clsx("h-full rounded-full", macro.color)} style={{ width: `${Math.min(100, (macro.value / macro.goal) * 100)}%` }} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function IntegrationCard({ data }: { data: DashboardData }) {
  return (
    <section className="rounded-[1.8rem] border border-white/8 bg-[#101f19]/78 p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-sky-300/70">Źródła danych</p>
          <h2 className="mt-1 text-lg font-black text-white">Integracje</h2>
        </div>
        <button type="button" aria-label="Ustawienia integracji" className="grid size-9 place-items-center rounded-xl text-white/35 transition hover:bg-white/5 hover:text-white">
          <Settings2 aria-hidden="true" className="size-4" />
        </button>
      </div>
      <div className="mt-4 space-y-2">
        {data.integrations.map((integration) => {
          const Icon = integrationIcons[integration.kind];
          const connected = integration.status === "connected";
          return (
            <div key={integration.id} className="flex items-center gap-3 rounded-2xl border border-white/7 bg-white/[.025] p-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-white/6 text-white/68">
                <Icon aria-hidden="true" className="size-4.5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-xs font-bold text-white/75">{integration.name}</p>
                <p className="mt-0.5 truncate text-[10px] text-white/34">{integration.detail}</p>
              </div>
              <span className={clsx("size-2 rounded-full", connected ? "bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,.65)]" : "bg-white/18")} />
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProgressCard({ data }: { data: DashboardData }) {
  return (
    <section id="progress-section" className="scroll-mt-5 rounded-[1.8rem] border border-white/8 bg-[#101f19]/78 p-5">
      <div className="mb-4 flex items-start justify-between gap-4">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/70">Ostatnie 6 tygodni</p>
          <h2 className="mt-1 text-lg font-black text-white">Forma i regeneracja</h2>
        </div>
        <span className="inline-flex items-center gap-1 rounded-full bg-emerald-400/10 px-2 py-1 text-[10px] font-bold text-emerald-300">
          <ArrowUpRight aria-hidden="true" className="size-3" />
          stabilnie
        </span>
      </div>
      <div className="h-48 w-full" aria-label="Wykres formy i regeneracji z ostatnich sześciu tygodni">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data.progress} margin={{ top: 8, right: 2, left: -28, bottom: 0 }}>
            <defs>
              <linearGradient id="trainingFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#f59a45" stopOpacity={0.32} />
                <stop offset="95%" stopColor="#f59a45" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="recoveryFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#5fba85" stopOpacity={0.2} />
                <stop offset="95%" stopColor="#5fba85" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="rgba(255,255,255,.055)" vertical={false} />
            <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,.32)", fontSize: 10 }} />
            <YAxis domain={[40, 100]} axisLine={false} tickLine={false} tick={{ fill: "rgba(255,255,255,.26)", fontSize: 9 }} />
            <Tooltip
              cursor={{ stroke: "rgba(255,255,255,.12)" }}
              contentStyle={{ background: "#13261e", border: "1px solid rgba(255,255,255,.1)", borderRadius: 14, color: "white", fontSize: 11 }}
            />
            <Area type="monotone" dataKey="recovery" name="Regeneracja" stroke="#5fba85" strokeWidth={2} fill="url(#recoveryFill)" />
            <Area type="monotone" dataKey="training" name="Forma" stroke="#f59a45" strokeWidth={2.4} fill="url(#trainingFill)" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

function PhotoCard() {
  return (
    <section className="group relative min-h-52 overflow-hidden rounded-[1.8rem] border border-white/8 bg-[linear-gradient(145deg,#1d392d,#0d1914)] p-5">
      <div aria-hidden="true" className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 70% 30%, rgba(239,140,61,.5), transparent 25%)" }} />
      <Mountain aria-hidden="true" className="absolute -bottom-9 -right-5 size-52 text-white/[.045]" strokeWidth={0.8} />
      <div className="relative">
        <span className="grid size-10 place-items-center rounded-2xl bg-orange-400/13 text-orange-300">
          <Camera aria-hidden="true" className="size-4.5" />
        </span>
        <h2 className="mt-6 text-lg font-black text-white">Galeria postępu</h2>
        <p className="mt-1 max-w-xs text-xs leading-5 text-white/42">Dodaj prywatne zdjęcie do treningu albo porównaj kolejne etapy swojej drogi.</p>
        <button type="button" disabled title="Dodawanie zdjęć pojawi się w kolejnej wersji" className="mt-5 inline-flex cursor-not-allowed items-center gap-2 rounded-xl border border-white/10 bg-white/6 px-3 py-2 text-xs font-bold text-white/50">
          <ImagePlus aria-hidden="true" className="size-4" />
          Zdjęcia w przygotowaniu
        </button>
      </div>
    </section>
  );
}

function QuickAddDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  if (!open) return null;
  const choices = [
    { label: "Jazda Rouvy", helper: "Trening lub import FIT", icon: Bike, color: "text-orange-300 bg-orange-400/12" },
    { label: "Jazda outdoor", helper: "Rower na zewnątrz", icon: Route, color: "text-amber-300 bg-amber-400/12" },
    { label: "Spacer", helper: "Lekka aktywność i regeneracja", icon: Footprints, color: "text-teal-300 bg-teal-400/12" },
    { label: "Hike", helper: "Wędrówka terenowa i przewyższenie", icon: Mountain, color: "text-yellow-300 bg-yellow-400/12" },
    { label: "Trening siłowy", helper: "Serie, powtórzenia, ciężar", icon: Dumbbell, color: "text-sky-300 bg-sky-400/12" },
    { label: "Posiłek", helper: "Kalorie i makroskładniki", icon: Utensils, color: "text-emerald-300 bg-emerald-400/12" },
    { label: "Zdjęcie postępu", helper: "Prywatny załącznik", icon: Camera, color: "text-violet-300 bg-violet-400/12" },
  ];

  return (
    <div className="fixed inset-0 z-50 grid place-items-end bg-black/65 p-0 backdrop-blur-sm sm:place-items-center sm:p-5" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <section role="dialog" aria-modal="true" aria-labelledby="quick-add-title" className="w-full max-w-lg rounded-t-[2rem] border border-white/10 bg-[#102019] p-5 shadow-2xl sm:rounded-[2rem] sm:p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-orange-300/75">Szybki wpis</p>
            <h2 id="quick-add-title" className="mt-1 text-2xl font-black text-white">Co chcesz dodać?</h2>
          </div>
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-white/5 text-white/45 transition hover:bg-white/10 hover:text-white" aria-label="Zamknij">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="mt-5 grid gap-2 sm:grid-cols-2">
          {choices.map((choice) => {
            const Icon = choice.icon;
            return (
              <button key={choice.label} type="button" disabled className="flex cursor-not-allowed items-center gap-3 rounded-2xl border border-white/8 bg-white/[.025] p-3.5 text-left opacity-60">
                <span className={clsx("grid size-11 shrink-0 place-items-center rounded-2xl", choice.color)}>
                  <Icon aria-hidden="true" className="size-5" />
                </span>
                <span>
                  <span className="block text-sm font-bold text-white/82">{choice.label}</span>
                  <span className="mt-0.5 block text-[10px] text-white/50">{choice.helper} · w przygotowaniu</span>
                </span>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function MobileNav({ active, onChange }: { active: DashboardSection; onChange: (section: DashboardSection) => void }) {
  return (
    <nav aria-label="Mobilna nawigacja" className="fixed inset-x-3 bottom-3 z-40 grid grid-cols-4 rounded-[1.4rem] border border-white/10 bg-[#0b1813]/95 p-1.5 shadow-[0_16px_50px_rgba(0,0,0,.45)] backdrop-blur-xl lg:hidden">
      {sectionItems.map((item) => {
        const Icon = item.icon;
        const selected = item.id === active;
        return (
          <button key={item.id} type="button" onClick={() => onChange(item.id)} aria-current={selected ? "page" : undefined} className={clsx("flex min-w-0 flex-col items-center gap-1 rounded-2xl py-2 text-[9px] font-bold transition", selected ? "bg-orange-400 text-[#102019]" : "text-white/40 hover:text-white")}>
            <Icon aria-hidden="true" className="size-4" />
            {item.label}
          </button>
        );
      })}
    </nav>
  );
}

function MobileMenu({ open, onClose, profile, onSwitchProfile, onLock }: { open: boolean; onClose: () => void; profile: DashboardProfile; onSwitchProfile?: () => void; onLock?: () => void }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden" role="presentation" onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <aside className="h-full w-[84%] max-w-xs border-r border-white/10 bg-[#0b1813] p-5 shadow-2xl">
        <div className="flex items-center justify-between">
          <BrandMark />
          <button type="button" onClick={onClose} className="grid size-10 place-items-center rounded-xl bg-white/5 text-white/50" aria-label="Zamknij menu">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        <div className="mt-8 rounded-3xl border border-white/8 bg-white/[.035] p-3">
          <button type="button" onClick={onSwitchProfile} className="flex w-full items-center gap-3 text-left">
            <ProfileAvatar profile={profile} />
            <span>
              <span className="block font-black text-white">{profile.name}</span>
              <span className="text-xs text-white/40">Przełącz profil</span>
            </span>
          </button>
        </div>
        <button type="button" onClick={onLock} className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/8 bg-white/4 px-4 py-3 text-sm font-bold text-white/60">
          <LockKeyhole aria-hidden="true" className="size-4" />
          Zablokuj profil
        </button>
      </aside>
    </div>
  );
}

export function Dashboard({ profile, data: providedData, onSwitchProfile, onLock }: DashboardProps) {
  const fallbackData = useMemo(() => createFallbackData(profile), [profile]);
  const data = providedData ?? fallbackData;
  const [activeSection, setActiveSection] = useState<DashboardSection>("overview");
  const [sessionState, setSessionState] = useState<Record<string, DashboardSession[]>>({});
  const sessions = sessionState[profile.id] ?? data.sessions;
  const [programLifecycles, setProgramLifecycles] = useState<ProgramLifecycleByProfile>({});
  const [programStorageReady, setProgramStorageReady] = useState(false);
  const [programManagerOpen, setProgramManagerOpen] = useState(false);
  const [quickAddOpen, setQuickAddOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const defaultProgram: ActiveProgram = useMemo(
    () => ({
      id: data.programId,
      title: data.programName,
      goal: data.programSubtitle,
      weeks: data.programWeeks,
      currentWeek: data.programCurrentWeek,
      progressPercent: data.programProgress,
      startedAt: new Date().toISOString(),
    }),
    [
      data.programCurrentWeek,
      data.programId,
      data.programName,
      data.programProgress,
      data.programSubtitle,
      data.programWeeks,
    ],
  );

  const programLifecycle =
    programLifecycles[profile.id] ?? createProgramLifecycle(defaultProgram);

  useEffect(() => {
    const saved = window.localStorage.getItem(PROGRAM_STORAGE_KEY);
    let cancelled = false;

    queueMicrotask(() => {
      if (cancelled) return;
      if (saved) setProgramLifecycles(parseProgramLifecycles(saved));
      setProgramStorageReady(true);
    });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!programStorageReady) return;
    window.localStorage.setItem(
      PROGRAM_STORAGE_KEY,
      JSON.stringify(programLifecycles),
    );
  }, [programLifecycles, programStorageReady]);

  const dashboardStyle = {
    "--profile-accent": profile.accent,
    "--profile-accent-soft": profile.accentSoft,
  } as CSSProperties;

  const toggleSession = (sessionId: string) => {
    setSessionState((current) => ({
      ...current,
      [profile.id]: (current[profile.id] ?? data.sessions).map((session) =>
        session.id === sessionId
          ? { ...session, completed: !session.completed }
          : session,
      ),
    }));
  };

  const updateProgram = (
    update: (current: ProgramLifecycle) => ProgramLifecycle,
  ) => {
    setProgramLifecycles((current) => ({
      ...current,
      [profile.id]: update(
        current[profile.id] ?? createProgramLifecycle(defaultProgram),
      ),
    }));
  };

  const finishProgram = (reason: string) => {
    updateProgram((current) => endProgram(current, reason));
  };

  const beginProgram = (template: ProgramTemplate) => {
    updateProgram((current) => startProgram(current, template));
  };

  const navigateTo = (section: DashboardSection) => {
    setActiveSection(section);
    const targetId: Partial<Record<DashboardSection, string>> = {
      plan: "plan-section",
      nutrition: "nutrition-section",
      progress: "progress-section",
    };
    const id = targetId[section];
    if (id) {
      window.requestAnimationFrame(() => {
        document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      });
    } else {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  return (
    <div className="min-h-dvh bg-[#08120e] text-white" style={dashboardStyle}>
      <div className="mx-auto flex min-h-dvh w-full max-w-[1800px]">
        <Sidebar active={activeSection} onChange={navigateTo} profile={profile} onSwitchProfile={onSwitchProfile} onLock={onLock} />
        <div className="min-w-0 flex-1 pb-24 lg:pb-0">
          <Topbar profile={profile} onMenu={() => setMobileMenuOpen(true)} onSwitchProfile={onSwitchProfile} />
          <main className="space-y-4 px-4 pb-8 sm:space-y-5 sm:px-6 lg:px-8">
            <p role="status" className="rounded-2xl border border-orange-300/25 bg-orange-400/10 px-4 py-3 text-sm text-orange-100">Wersja przedprodukcyjna: zmiany programu są zapisywane lokalnie. Dane przykładowe i PIN nie zapewniają jeszcze ochrony konta — nie wpisuj prawdziwych danych zdrowotnych.</p>
            <Hero profile={profile} data={data} onQuickAdd={() => setQuickAddOpen(true)} />
            <Metrics metrics={data.metrics} />

            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(300px,.75fr)]">
              <WeeklyPlan sessions={sessions} onToggle={toggleSession} />
              <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
                <ProgramCard
                  active={programLifecycle.active}
                  historyCount={programLifecycle.history.length}
                  onManage={() => setProgramManagerOpen(true)}
                />
                <NutritionCard data={data} />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-[minmax(0,1.25fr)_minmax(260px,.72fr)_minmax(260px,.72fr)]">
              <ProgressCard data={data} />
              <IntegrationCard data={data} />
              <PhotoCard />
            </div>
          </main>
        </div>
      </div>

      <MobileNav active={activeSection} onChange={navigateTo} />
      <MobileMenu open={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} profile={profile} onSwitchProfile={onSwitchProfile} onLock={onLock} />
      <ProgramManagerDialog
        active={programLifecycle.active}
        history={programLifecycle.history}
        onClose={() => setProgramManagerOpen(false)}
        onEnd={finishProgram}
        onStart={beginProgram}
        open={programManagerOpen}
      />
      <QuickAddDialog open={quickAddOpen} onClose={() => setQuickAddOpen(false)} />
    </div>
  );
}

export default Dashboard;
