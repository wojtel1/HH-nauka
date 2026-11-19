import { format, parseISO } from "date-fns";
import { pl } from "date-fns/locale";

export function formatDuration(minutes: number) {
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;

  if (hours === 0) return `${rest} min`;
  if (rest === 0) return `${hours} godz.`;
  return `${hours} godz. ${rest} min`;
}

export function formatPolishDay(isoDate: string) {
  return format(parseISO(isoDate), "EEEE, d MMM", { locale: pl });
}

export function formatNumber(value: number, maximumFractionDigits = 0) {
  return new Intl.NumberFormat("pl-PL", { maximumFractionDigits }).format(value);
}

export function formatPercent(value: number) {
  return `${Math.max(0, Math.min(100, Math.round(value)))}%`;
}
