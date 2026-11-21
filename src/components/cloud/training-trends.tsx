"use client";

import { Award, Clock3, Flame, Mountain, Route, TrendingUp } from "lucide-react";
import { useMemo, useState } from "react";

import { buildTrainingTrend, calculateTrainingStreak } from "@/lib/training-report";

import type { CloudSession } from "./types";

interface TrainingTrendsProps {
  sessions: CloudSession[];
  targetSessions: number;
  today: string;
}

const weekLabelFormatter = new Intl.DateTimeFormat("pl-PL", {
  day: "numeric",
  month: "short",
  timeZone: "UTC",
});

function dateFromISO(value: string) {
  return new Date(`${value}T00:00:00.000Z`);
}

export function TrainingTrends({ sessions, targetSessions, today }: TrainingTrendsProps) {
  const [metric, setMetric] = useState<"minutes" | "distance">("minutes");
  const trend = useMemo(
    () => buildTrainingTrend(sessions, today, 8, targetSessions),
    [sessions, targetSessions, today],
  );
  const streak = calculateTrainingStreak(trend);
  const completed = sessions.filter((session) => session.status === "completed");
  const longestDuration = completed.reduce(
    (best, session) => Math.max(best, session.durationMinutes),
    0,
  );
  const longestDistance = completed.reduce(
    (best, session) => Math.max(best, session.metrics.distanceKm ?? 0),
    0,
  );
  const highestElevation = completed.reduce(
    (best, session) => Math.max(best, session.metrics.elevationMeters ?? 0),
    0,
  );
  const values = trend.map((point) => metric === "minutes" ? point.completedMinutes : point.distanceKm);
  const maximum = Math.max(1, ...values);

  return (
    <section className="mt-4 rounded-[1.75rem] border border-white/10 bg-[#10251d]/80 p-4 sm:p-6" aria-labelledby="progress-heading">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[.18em] text-emerald-300/70">Ostatnie 8 tygodni</p>
          <h2 id="progress-heading" className="mt-1 text-xl font-black">Progres i regularność</h2>
        </div>
        <div className="flex rounded-xl border border-white/10 bg-black/10 p-1" aria-label="Metryka wykresu">
          <button type="button" onClick={() => setMetric("minutes")} className={`rounded-lg px-3 py-2 text-[11px] font-black ${metric === "minutes" ? "bg-orange-400 text-[#102019]" : "text-white/45"}`}>Czas</button>
          <button type="button" onClick={() => setMetric("distance")} className={`rounded-lg px-3 py-2 text-[11px] font-black ${metric === "distance" ? "bg-orange-400 text-[#102019]" : "text-white/45"}`}>Dystans</button>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-2 gap-2 lg:grid-cols-4">
        <div className="rounded-2xl bg-black/15 p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Flame aria-hidden="true" className="size-3 text-orange-300" /> Regularna seria</p>
          <p className="mt-1 text-lg font-black">{streak} {streak === 1 ? "tydzień" : "tygodnie"}</p>
        </div>
        <div className="rounded-2xl bg-black/15 p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Clock3 aria-hidden="true" className="size-3" /> Najdłuższy trening</p>
          <p className="mt-1 text-lg font-black">{longestDuration} min</p>
        </div>
        <div className="rounded-2xl bg-black/15 p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Route aria-hidden="true" className="size-3" /> Najdłuższy dystans</p>
          <p className="mt-1 text-lg font-black">{longestDistance.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} km</p>
        </div>
        <div className="rounded-2xl bg-black/15 p-3">
          <p className="inline-flex items-center gap-1 text-[10px] text-white/35"><Mountain aria-hidden="true" className="size-3" /> Rekord przewyższenia</p>
          <p className="mt-1 text-lg font-black">{highestElevation.toLocaleString("pl-PL")} m</p>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-white/8 bg-black/10 p-3 sm:p-4">
        <div className="flex items-center justify-between gap-3">
          <p className="inline-flex items-center gap-2 text-xs font-black text-white/60"><TrendingUp aria-hidden="true" className="size-4 text-emerald-300" /> {metric === "minutes" ? "Minuty aktywności" : "Dystans w kilometrach"}</p>
          <Award aria-hidden="true" className="size-4 text-orange-300/60" />
        </div>
        <div className="mt-4 flex h-44 items-end gap-1.5 sm:gap-3" role="img" aria-label={`Wykres: ${metric === "minutes" ? "minuty aktywności" : "dystans"} z ostatnich ośmiu tygodni`}>
          {trend.map((point, index) => {
            const value = values[index];
            const height = value === 0 ? 3 : Math.max(8, Math.round((value / maximum) * 100));
            const label = weekLabelFormatter.format(dateFromISO(point.weekStart));
            const valueLabel = metric === "minutes"
              ? `${value} min`
              : `${value.toLocaleString("pl-PL", { maximumFractionDigits: 1 })} km`;
            return (
              <div key={point.weekStart} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center" title={`${label}: ${valueLabel}`}>
                <span className="mb-1 truncate text-[9px] font-bold text-white/35">{value > 0 ? valueLabel : "—"}</span>
                <div className="flex h-32 items-end rounded-lg bg-white/[.025] px-1">
                  <div className={`w-full rounded-t-md ${index === trend.length - 1 ? "bg-orange-400" : "bg-emerald-400/65"}`} style={{ height: `${height}%` }} />
                </div>
                <span className="mt-2 truncate text-[9px] text-white/30">{label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
