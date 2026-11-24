"use client";

import { useActionState } from "react";
import { acceptFamilyInvitation, createFamilyInvitation, type CloudActionState } from "@/app/cloud/actions";

const initialState: CloudActionState = { status: "idle", message: "" };
const field = "block w-full rounded-xl border border-white/15 bg-[#10251d] px-3 py-2 text-sm";
const button = "rounded-xl bg-orange-400 px-4 py-2 text-sm font-bold text-[#102019] disabled:opacity-50";

export function FamilyInvitation({ profiles }: { profiles: { id: string; name: string }[] }) {
  const [state, action, pending] = useActionState(createFamilyInvitation, initialState);

  return (
    <details className="mt-4 rounded-2xl border border-white/10 p-4">
      <summary className="cursor-pointer font-bold">Zaproś do rodziny</summary>
      {profiles.length === 0 ? (
        <p className="mt-3 text-sm text-white/70">Dodaj profil osoby, którą chcesz zaprosić.</p>
      ) : (
        <form action={action} className="mt-3 max-w-md space-y-3">
          <p className="text-sm text-white/70">
            Zaproszona osoba zaloguje się własnym e-mailem i uzyska dostęp do wspólnej przestrzeni oraz treningów rodziny.
          </p>
          <label className="block text-sm">Profil do połączenia
            <select className={field} name="profileId" required>
              {profiles.map((profile) => <option key={profile.id} value={profile.id}>{profile.name}</option>)}
            </select>
          </label>
          <label className="block text-sm">E-mail zapraszanej osoby
            <input className={field} name="email" type="email" required maxLength={254} />
          </label>
          <button className={button} disabled={pending}>{pending ? "Tworzenie…" : "Utwórz kod zaproszenia"}</button>
          {state.status === "error" ? <p role="alert">{state.message}</p> : null}
          {state.status === "success" ? (
            <div role="status" className="space-y-2 text-sm">
              <label className="block">Przekaż kod zaproszonej osobie. Kod jest ważny 48 godzin.
                <input className={field} readOnly value={state.message} onFocus={(event) => event.currentTarget.select()} />
              </label>
            </div>
          ) : null}
        </form>
      )}
    </details>
  );
}

export function JoinFamily() {
  const [state, action, pending] = useActionState(acceptFamilyInvitation, initialState);
  return (
    <details className="mt-5 rounded-2xl border border-white/10 p-4">
      <summary className="cursor-pointer font-bold">Mam kod zaproszenia</summary>
      <form action={action} className="mt-3 space-y-3">
        <label className="block text-sm">Kod zaproszenia
          <input className={field} name="code" autoComplete="off" spellCheck={false} required />
        </label>
        {state.status === "error" ? <p role="alert" className="text-sm text-red-200">{state.message}</p> : null}
        <button className={button} disabled={pending}>{pending ? "Sprawdzanie…" : "Dołącz do rodziny"}</button>
      </form>
    </details>
  );
}
