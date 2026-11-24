"use client";

import { useEffect, useState } from "react";

type InstallEvent = Event & { prompt: () => Promise<unknown> };

export function InstallMenu() {
  const [prompt, setPrompt] = useState<InstallEvent | null>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    const standalone = window.matchMedia("(display-mode: standalone)");
    const updateDisplayMode = () => {
      setInstalled(standalone.matches || (navigator as Navigator & { standalone?: boolean }).standalone === true);
    };
    const capturePrompt = (event: Event) => {
      event.preventDefault();
      setPrompt(event as InstallEvent);
    };
    const onInstalled = () => setInstalled(true);
    const frame = window.requestAnimationFrame(updateDisplayMode);
    standalone.addEventListener("change", updateDisplayMode);
    window.addEventListener("beforeinstallprompt", capturePrompt);
    window.addEventListener("appinstalled", onInstalled);
    return () => {
      window.cancelAnimationFrame(frame);
      standalone.removeEventListener("change", updateDisplayMode);
      window.removeEventListener("beforeinstallprompt", capturePrompt);
      window.removeEventListener("appinstalled", onInstalled);
    };
  }, []);

  if (installed) return null;

  return (
    <details className="my-4 rounded-xl border border-white/10 px-4 py-3 text-sm">
      <summary className="cursor-pointer font-bold">Zainstaluj Endurance</summary>
      <div className="mt-3 space-y-2 text-white/75">
        {prompt ? (
          <button type="button" className="rounded-xl bg-orange-400 px-4 py-2 font-bold text-[#102019]" onClick={async () => {
            try {
              await prompt.prompt();
            } catch {
              // The manual installation instructions remain available.
            } finally {
              setPrompt(null);
            }
          }}>Zainstaluj na tym urządzeniu</button>
        ) : null}
        <p><strong>Android.</strong> Otwórz menu Chrome i wybierz opcję instalacji lub dodania do ekranu głównego.</p>
        <p><strong>iPhone.</strong> W Safari otwórz menu udostępniania i dodaj Endurance do ekranu początkowego.</p>
        <p><strong>Komputer.</strong> W Chrome lub Edge użyj opcji instalacji w pasku adresu lub w menu przeglądarki.</p>
      </div>
    </details>
  );
}
