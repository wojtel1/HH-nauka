"use client";

import {
  ArrowLeft,
  Check,
  Delete as DeleteIcon,
  KeyRound,
  LockKeyhole,
  ShieldCheck,
  UserRoundCheck,
  UsersRound,
} from "lucide-react";
import {
  type CSSProperties,
  type FormEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import { hasLocalPin, saveLocalPin, verifyLocalPin } from "./pin-storage";
import type { FamilyProfile, ProfileGateControls } from "./types";
import { useAutoLock } from "./use-auto-lock";

const PIN_LENGTH = 6;
const MAX_ATTEMPTS = 5;
const LOCAL_BLOCK_MS = 30_000;

type Screen = "select" | "setup" | "unlock";

type ProfileGateProps = {
  children: (
    profile: FamilyProfile,
    controls: ProfileGateControls,
  ) => ReactNode;
  idleTimeoutMs?: number;
  lockOnHidden?: boolean;
  onProfileChange?: (profile: FamilyProfile | null) => void;
  profiles: FamilyProfile[];
  storageNamespace?: string;
};

function sanitizePin(value: string) {
  return value.replace(/\D/g, "").slice(0, PIN_LENGTH);
}

function PinDots({ length }: { length: number }) {
  return (
    <div className="flex justify-center gap-3" aria-hidden="true">
      {Array.from({ length: PIN_LENGTH }, (_, index) => (
        <span
          key={index}
          className={`size-3 rounded-full border transition-all duration-200 ${
            index < length
              ? "scale-110 border-orange-400 bg-orange-400 shadow-[0_0_16px_rgba(251,146,60,.55)]"
              : "border-white/25 bg-white/5"
          }`}
        />
      ))}
    </div>
  );
}

type PinPadProps = {
  disabled?: boolean;
  onChange: (pin: string) => void;
  onSubmit: () => void;
  pin: string;
};

function PinPad({ disabled = false, onChange, onSubmit, pin }: PinPadProps) {
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const appendDigit = (digit: string) => {
    if (disabled || pin.length >= PIN_LENGTH) return;
    onChange(`${pin}${digit}`);
  };

  return (
    <div className="mx-auto w-full max-w-[280px]">
      <label htmlFor="profile-pin" className="sr-only">
        Sześciocyfrowy PIN profilu
      </label>
      <input
        ref={inputRef}
        id="profile-pin"
        type="password"
        inputMode="numeric"
        autoComplete="off"
        pattern="[0-9]*"
        value={pin}
        maxLength={PIN_LENGTH}
        disabled={disabled}
        onChange={(event) => onChange(sanitizePin(event.target.value))}
        onKeyDown={(event) => {
          if (event.key === "Enter" && pin.length === PIN_LENGTH) onSubmit();
        }}
        className="pointer-events-none absolute size-px opacity-0"
      />
      <PinDots length={pin.length} />
      <div className="mt-6 grid grid-cols-3 gap-2" aria-label="Klawiatura PIN">
        {["1", "2", "3", "4", "5", "6", "7", "8", "9"].map(
          (digit) => (
            <button
              key={digit}
              type="button"
              disabled={disabled}
              onClick={() => appendDigit(digit)}
              className="grid h-12 place-items-center rounded-2xl border border-white/10 bg-white/[.06] text-lg font-bold text-white transition hover:border-white/20 hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              aria-label={`Cyfra ${digit}`}
            >
              {digit}
            </button>
          ),
        )}
        <button
          type="button"
          disabled={disabled || pin.length === 0}
          onClick={() => onChange(pin.slice(0, -1))}
          className="grid h-12 place-items-center rounded-2xl text-white/55 transition hover:bg-white/[.06] hover:text-white disabled:opacity-30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          aria-label="Usuń ostatnią cyfrę"
        >
        <DeleteIcon className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          disabled={disabled}
          onClick={() => appendDigit("0")}
          className="grid h-12 place-items-center rounded-2xl border border-white/10 bg-white/[.06] text-lg font-bold text-white transition hover:border-white/20 hover:bg-white/10 active:scale-95 disabled:opacity-45 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
          aria-label="Cyfra 0"
        >
          0
        </button>
        <button
          type="button"
          disabled={disabled || pin.length !== PIN_LENGTH}
          onClick={onSubmit}
          className="grid h-12 place-items-center rounded-2xl bg-orange-500 text-white shadow-lg shadow-orange-950/30 transition hover:bg-orange-400 active:scale-95 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/25 disabled:shadow-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-300"
          aria-label="Potwierdź PIN"
        >
          <Check className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}

export function ProfileGate({
  children,
  idleTimeoutMs = 15 * 60 * 1000,
  lockOnHidden = true,
  onProfileChange,
  profiles,
  storageNamespace = "family-fitness-demo",
}: ProfileGateProps) {
  const [screen, setScreen] = useState<Screen>("select");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [unlockedId, setUnlockedId] = useState<string | null>(null);
  const [pin, setPin] = useState("");
  const [firstPin, setFirstPin] = useState<string | null>(null);
  const [error, setError] = useState("");
  const [isWorking, setIsWorking] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [blockedUntil, setBlockedUntil] = useState(0);
  const [clockNow, setClockNow] = useState(0);

  const selectedProfile = useMemo(
    () => profiles.find((profile) => profile.id === selectedId) ?? null,
    [profiles, selectedId],
  );
  const unlockedProfile = useMemo(
    () => profiles.find((profile) => profile.id === unlockedId) ?? null,
    [profiles, unlockedId],
  );

  const clearEntryState = useCallback(() => {
    setPin("");
    setFirstPin(null);
    setError("");
    setIsWorking(false);
  }, []);

  const lock = useCallback(() => {
    setUnlockedId(null);
    onProfileChange?.(null);
    clearEntryState();
    setScreen(selectedId && hasLocalPin(storageNamespace, selectedId) ? "unlock" : "select");
  }, [clearEntryState, onProfileChange, selectedId, storageNamespace]);

  const switchProfile = useCallback(() => {
    setUnlockedId(null);
    setSelectedId(null);
    onProfileChange?.(null);
    clearEntryState();
    setAttempts(0);
    setBlockedUntil(0);
    setScreen("select");
  }, [clearEntryState, onProfileChange]);

  useAutoLock({
    enabled: unlockedProfile !== null,
    idleTimeoutMs,
    lockOnHidden,
    onLock: lock,
  });

  useEffect(() => {
    if (blockedUntil <= Date.now()) return;

    const intervalId = window.setInterval(() => setClockNow(Date.now()), 500);
    return () => window.clearInterval(intervalId);
  }, [blockedUntil]);

  const remainingBlockSeconds = Math.max(
    0,
    Math.ceil((blockedUntil - clockNow) / 1000),
  );

  const chooseProfile = (profile: FamilyProfile) => {
    setSelectedId(profile.id);
    setScreen(hasLocalPin(storageNamespace, profile.id) ? "unlock" : "setup");
    clearEntryState();
    setAttempts(0);
    setBlockedUntil(0);
  };

  const finishUnlock = (profile: FamilyProfile) => {
    clearEntryState();
    setAttempts(0);
    setUnlockedId(profile.id);
    onProfileChange?.(profile);
  };

  const submitPin = async () => {
    if (!selectedProfile || pin.length !== PIN_LENGTH || isWorking) return;
    if (remainingBlockSeconds > 0) return;

    setError("");
    setIsWorking(true);

    try {
      if (screen === "setup") {
        if (firstPin === null) {
          setFirstPin(pin);
          setPin("");
          return;
        }
        if (firstPin !== pin) {
          setError("Kody różnią się. Wprowadź nowy PIN od początku.");
          setFirstPin(null);
          setPin("");
          return;
        }

        await saveLocalPin(storageNamespace, selectedProfile.id, pin);
        finishUnlock(selectedProfile);
        return;
      }

      const isValid = await verifyLocalPin(
        storageNamespace,
        selectedProfile.id,
        pin,
      );
      if (isValid) {
        finishUnlock(selectedProfile);
        return;
      }

      const effectiveAttempts =
        blockedUntil > 0 && Date.now() >= blockedUntil ? 0 : attempts;
      if (effectiveAttempts === 0 && attempts !== 0) {
        setBlockedUntil(0);
      }
      const nextAttempts = effectiveAttempts + 1;
      setAttempts(nextAttempts);
      setPin("");
      if (nextAttempts >= MAX_ATTEMPTS) {
        const now = Date.now();
        setClockNow(now);
        setBlockedUntil(now + LOCAL_BLOCK_MS);
        setError("Za dużo prób. Lokalna blokada została włączona na 30 sekund.");
      } else {
        setError(`Nieprawidłowy PIN. Pozostało prób: ${MAX_ATTEMPTS - nextAttempts}.`);
      }
    } finally {
      setIsWorking(false);
    }
  };

  const handleFormSubmit = (event: FormEvent) => {
    event.preventDefault();
    void submitPin();
  };

  if (unlockedProfile) {
    return <>{children(unlockedProfile, { lock, switchProfile })}</>;
  }

  return (
    <main className="relative min-h-dvh overflow-hidden bg-[#071a14] text-white">
      <div
        className="pointer-events-none absolute inset-0 opacity-80"
        aria-hidden="true"
        style={{
          background:
            selectedProfile?.background ??
            "radial-gradient(circle at 15% 0%, #24563c 0, transparent 38%), radial-gradient(circle at 90% 85%, #7c3712 0, transparent 32%)",
        }}
      />
      <div
        className="pointer-events-none absolute inset-0 opacity-[.14]"
        aria-hidden="true"
        style={{
          backgroundImage:
            "repeating-radial-gradient(ellipse at 15% 20%, transparent 0 22px, rgba(255,255,255,.35) 23px 24px)",
        }}
      />
      <div className="relative mx-auto flex min-h-dvh w-full max-w-6xl flex-col px-5 py-6 sm:px-8 lg:px-12">
        <header className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-2xl border border-orange-300/20 bg-orange-500 text-white shadow-xl shadow-orange-950/25">
              <KeyRound className="size-5" aria-hidden="true" />
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-[.24em] text-orange-300">
                Rodzinna strefa
              </p>
              <p className="text-sm font-bold text-white/85">Prywatne profile</p>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/[.06] px-3 py-2 text-xs text-white/65 backdrop-blur">
            <ShieldCheck className="size-4 text-emerald-300" aria-hidden="true" />
            Dane prywatne
          </div>
        </header>

        <section className="flex flex-1 items-center justify-center py-10">
          {screen === "select" ? (
            <div className="w-full max-w-4xl text-center">
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-[1.4rem] border border-white/10 bg-white/[.08] shadow-2xl shadow-black/20 backdrop-blur-xl">
                <UsersRound className="size-7 text-orange-300" aria-hidden="true" />
              </div>
              <p className="text-xs font-black uppercase tracking-[.26em] text-orange-300">
                Witajcie w domu
              </p>
              <h1 className="mt-3 text-balance text-3xl font-black tracking-[-.04em] sm:text-5xl">
                Wybierz profil
              </h1>
              <p className="mx-auto mt-4 max-w-xl text-sm leading-6 text-white/60 sm:text-base">
                Kto dziś trenuje? Każdy profil ma osobny plan, historię i
                ustawienia prywatności. Wybierz swój avatar, aby przejść dalej.
              </p>

              <div
                className="mt-9 grid gap-3 sm:grid-cols-3"
                aria-label="Profile rodzinne"
              >
                {profiles.map((profile) => (
                  <button
                    key={profile.id}
                    type="button"
                    onClick={() => chooseProfile(profile)}
                    className="group relative overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[.07] p-5 text-left shadow-xl shadow-black/10 backdrop-blur-xl transition duration-300 hover:-translate-y-1 hover:border-white/25 hover:bg-white/[.11] focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-orange-400"
                    style={{ "--profile-accent": profile.accent } as CSSProperties}
                  >
                    <span
                      className="pointer-events-none absolute -right-8 -top-8 size-28 rounded-full opacity-20 blur-2xl transition group-hover:opacity-35"
                      style={{ background: profile.accent }}
                      aria-hidden="true"
                    />
                    <span
                      className="relative grid size-16 place-items-center rounded-2xl text-xl font-black text-white shadow-lg ring-1 ring-white/20"
                      style={{ background: profile.accent }}
                      aria-hidden="true"
                    >
                      {profile.initials}
                    </span>
                    <span className="relative mt-6 flex items-end justify-between gap-3">
                      <span>
                        <span className="block text-xl font-extrabold">{profile.name}</span>
                        <span className="mt-1 block text-xs leading-5 text-white/55">
                          {profile.subtitle}
                        </span>
                      </span>
                      <span className="grid size-9 shrink-0 place-items-center rounded-full border border-white/10 bg-white/[.06] text-white/55 transition group-hover:bg-white/15 group-hover:text-white">
                        <LockKeyhole className="size-4" aria-hidden="true" />
                      </span>
                    </span>
                  </button>
                ))}
              </div>

              <p className="mx-auto mt-7 flex max-w-xl items-start justify-center gap-2 text-left text-xs leading-5 text-white/40 sm:text-center">
                <ShieldCheck className="mt-0.5 size-4 shrink-0 text-emerald-300/70" aria-hidden="true" />
                Członkostwo w rodzinie nie daje dostępu do cudzych treningów,
                diety ani zdjęć. Udostępniasz tylko to, co wybierzesz.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-md">
              <button
                type="button"
                onClick={switchProfile}
                className="mb-5 inline-flex items-center gap-2 rounded-full px-3 py-2 text-xs font-bold text-white/55 transition hover:bg-white/[.06] hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
              >
                <ArrowLeft className="size-4" aria-hidden="true" />
                Wybierz inny profil
              </button>
              <div className="rounded-[2rem] border border-white/10 bg-[#0b231b]/85 p-6 shadow-2xl shadow-black/30 backdrop-blur-2xl sm:p-8">
                <div className="text-center">
                  <div
                    className="mx-auto grid size-16 place-items-center rounded-2xl text-xl font-black text-white shadow-xl ring-1 ring-white/20"
                    style={{ background: selectedProfile?.accent }}
                    aria-hidden="true"
                  >
                    {selectedProfile?.initials}
                  </div>
                  <p className="mt-5 text-xs font-black uppercase tracking-[.22em] text-orange-300">
                    {screen === "setup" ? "Pierwsze uruchomienie" : "Profil zablokowany"}
                  </p>
                  <h1 className="mt-2 text-2xl font-black tracking-tight">
                    {screen === "setup"
                      ? firstPin === null
                        ? `Ustaw PIN dla ${selectedProfile?.name}`
                        : "Powtórz swój PIN"
                      : `Witaj, ${selectedProfile?.name}`}
                  </h1>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-white/55">
                    {screen === "setup"
                      ? firstPin === null
                        ? "Wybierz 6 cyfr. Kod blokuje ten profil na obecnym urządzeniu."
                        : "Wpisz ponownie ten sam kod, aby go potwierdzić."
                      : "Wprowadź swój 6-cyfrowy kod, aby zobaczyć prywatne dane."}
                  </p>
                </div>

                <form onSubmit={handleFormSubmit} className="mt-7">
                  <PinPad
                    pin={pin}
                    onChange={(nextPin) => {
                      setPin(nextPin);
                      setError("");
                    }}
                    onSubmit={() => void submitPin()}
                    disabled={isWorking || remainingBlockSeconds > 0}
                  />
                </form>

                <div className="mt-5 min-h-10 text-center">
                  {isWorking ? (
                    <p className="text-xs text-white/50" role="status">
                      Bezpieczne sprawdzanie kodu…
                    </p>
                  ) : error ? (
                    <p className="text-xs leading-5 text-rose-300" role="alert">
                      {error}
                    </p>
                  ) : remainingBlockSeconds > 0 ? (
                    <p className="text-xs leading-5 text-amber-300" role="status">
                      Spróbuj ponownie za {remainingBlockSeconds} s.
                    </p>
                  ) : null}
                </div>

                <div className="mt-2 flex gap-3 rounded-2xl border border-amber-300/10 bg-amber-300/[.05] p-3 text-[11px] leading-4 text-amber-100/55">
                  <UserRoundCheck className="mt-0.5 size-4 shrink-0 text-amber-300/75" aria-hidden="true" />
                  <p>
                    To lokalna blokada demonstracyjna. W produkcji konto i reset
                    PIN-u zabezpieczy logowanie serwerowe, passkey oraz biometria.
                  </p>
                </div>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
