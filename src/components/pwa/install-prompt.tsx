"use client";

import { Download, Share2, X } from "lucide-react";
import { useEffect, useState } from "react";

type InstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

const DISMISS_KEY = "trailvelo-install-prompt-dismissed";

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(
    null,
  );
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(true);
  const [isDismissed, setIsDismissed] = useState(true);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      setIsStandalone(
        window.matchMedia("(display-mode: standalone)").matches,
      );
      setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
      setIsDismissed(window.localStorage.getItem(DISMISS_KEY) === "true");
    });

    const captureInstallPrompt = (event: Event) => {
      event.preventDefault();
      setInstallEvent(event as InstallPromptEvent);
    };

    window.addEventListener("beforeinstallprompt", captureInstallPrompt);
    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener("beforeinstallprompt", captureInstallPrompt);
    };
  }, []);

  if (isStandalone || isDismissed || (!installEvent && !isIOS)) {
    return null;
  }

  const dismiss = () => {
    window.localStorage.setItem(DISMISS_KEY, "true");
    setIsDismissed(true);
  };

  const install = async () => {
    if (!installEvent) return;

    await installEvent.prompt();
    const choice = await installEvent.userChoice;
    if (choice.outcome === "accepted") dismiss();
    setInstallEvent(null);
  };

  return (
    <aside
      aria-label="Instalacja aplikacji"
      className="fixed inset-x-4 bottom-24 z-50 mx-auto max-w-md rounded-3xl border border-white/10 bg-[#102b22]/95 p-4 text-white shadow-2xl backdrop-blur-xl md:bottom-6"
    >
      <button
        type="button"
        onClick={dismiss}
        aria-label="Zamknij wskazówkę instalacji"
        className="absolute right-3 top-3 rounded-full p-2 text-white/60 transition hover:bg-white/10 hover:text-white"
      >
        <X aria-hidden="true" size={18} />
      </button>

      <div className="flex items-start gap-3 pr-8">
        <span className="rounded-2xl bg-[#ff7629]/15 p-3 text-[#ff8c42]">
          {isIOS ? (
            <Share2 aria-hidden="true" size={22} />
          ) : (
            <Download aria-hidden="true" size={22} />
          )}
        </span>
        <div>
          <p className="font-semibold">Zainstaluj TrailVelo</p>
          <p className="mt-1 text-sm leading-5 text-white/65">
            {isIOS
              ? "W Safari wybierz Udostępnij, a następnie Dodaj do ekranu początkowego."
              : "Dodaj aplikację do ekranu głównego, aby otwierała się jak aplikacja mobilna."}
          </p>
          {!isIOS && installEvent ? (
            <button
              type="button"
              onClick={install}
              className="mt-3 rounded-full bg-[#ff7629] px-4 py-2 text-sm font-semibold text-[#12231d] transition hover:bg-[#ff9459]"
            >
              Zainstaluj
            </button>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
