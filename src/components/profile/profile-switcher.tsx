"use client";

import { LockKeyhole, UsersRound } from "lucide-react";

import type { FamilyProfile } from "./types";

type ProfileSwitcherProps = {
  onLock: () => void;
  onSwitch: () => void;
  profile: FamilyProfile;
};

export function ProfileSwitcher({
  onLock,
  onSwitch,
  profile,
}: ProfileSwitcherProps) {
  return (
    <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 p-1.5 shadow-lg shadow-black/10 backdrop-blur-xl">
      <div
        className="grid size-9 shrink-0 place-items-center rounded-full text-xs font-black text-white shadow-inner"
        style={{ background: profile.accent }}
        aria-hidden="true"
      >
        {profile.initials}
      </div>
      <div className="hidden min-w-0 pl-1 sm:block">
        <p className="truncate text-xs font-extrabold text-white">{profile.name}</p>
        <p className="truncate text-[10px] text-white/55">Profil prywatny</p>
      </div>
      <button
        type="button"
        onClick={onLock}
        className="grid size-9 place-items-center rounded-full text-white/65 transition hover:bg-white/10 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        aria-label={`Zablokuj profil ${profile.name}`}
        title="Zablokuj profil"
      >
        <LockKeyhole className="size-4" aria-hidden="true" />
      </button>
      <button
        type="button"
        onClick={onSwitch}
        className="grid size-9 place-items-center rounded-full bg-white/10 text-white/75 transition hover:bg-white/20 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-400"
        aria-label="Zmień profil"
        title="Zmień profil"
      >
        <UsersRound className="size-4" aria-hidden="true" />
      </button>
    </div>
  );
}
