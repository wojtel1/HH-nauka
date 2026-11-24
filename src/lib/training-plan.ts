import { addDaysISO, startOfWeekISO } from "@/lib/training-calendar";

export type PlanFocus = "balanced" | "cycling" | "outdoor" | "recovery";

export interface GeneratedTrainingSession {
  scheduledFor: string;
  title: string;
  subtitle: string;
  kind: "cycling" | "strength" | "mobility" | "recovery" | "walking" | "hiking";
  environment: "indoor" | "outdoor";
  intensity: "easy" | "moderate" | "hard";
  durationMinutes: number;
}

type SessionTemplate = Omit<GeneratedTrainingSession, "scheduledFor">;

const templates: Record<PlanFocus, SessionTemplate[]> = {
  balanced: [
    { title: "Jazda bazowa outdoor", subtitle: "Spokojna wytrzymałość tlenowa", kind: "cycling", environment: "outdoor", intensity: "moderate", durationMinutes: 75 },
    { title: "Siła całego ciała", subtitle: "Stabilizacja, nogi i korpus", kind: "strength", environment: "indoor", intensity: "moderate", durationMinutes: 45 },
    { title: "Spacer regeneracyjny", subtitle: "Swobodne tempo i świeże powietrze", kind: "walking", environment: "outdoor", intensity: "easy", durationMinutes: 40 },
    { title: "Hike terenowy", subtitle: "Równe tempo na zróżnicowanym terenie", kind: "hiking", environment: "outdoor", intensity: "moderate", durationMinutes: 120 },
    { title: "Rower indoor · tempo", subtitle: "Kontrolowana praca w równym rytmie", kind: "cycling", environment: "indoor", intensity: "hard", durationMinutes: 60 },
    { title: "Mobilność", subtitle: "Biodra, plecy i obręcz barkowa", kind: "mobility", environment: "indoor", intensity: "easy", durationMinutes: 25 },
    { title: "Aktywna regeneracja", subtitle: "Bardzo lekki ruch i oddech", kind: "recovery", environment: "indoor", intensity: "easy", durationMinutes: 30 },
  ],
  cycling: [
    { title: "Jazda bazowa outdoor", subtitle: "Wytrzymałość tlenowa", kind: "cycling", environment: "outdoor", intensity: "moderate", durationMinutes: 90 },
    { title: "Siła dla kolarza", subtitle: "Nogi, pośladki i stabilizacja", kind: "strength", environment: "indoor", intensity: "moderate", durationMinutes: 45 },
    { title: "Interwały indoor", subtitle: "Krótkie, kontrolowane odcinki", kind: "cycling", environment: "indoor", intensity: "hard", durationMinutes: 55 },
    { title: "Spacer regeneracyjny", subtitle: "Lekki ruch pomiędzy jazdami", kind: "walking", environment: "outdoor", intensity: "easy", durationMinutes: 35 },
    { title: "Dłuższa jazda outdoor", subtitle: "Spokojny, równy wysiłek", kind: "cycling", environment: "outdoor", intensity: "moderate", durationMinutes: 150 },
    { title: "Mobilność po rowerze", subtitle: "Biodra, łydki i odcinek piersiowy", kind: "mobility", environment: "indoor", intensity: "easy", durationMinutes: 25 },
    { title: "Lekki rower indoor", subtitle: "Rozjazd regeneracyjny", kind: "cycling", environment: "indoor", intensity: "easy", durationMinutes: 40 },
  ],
  outdoor: [
    { title: "Jazda outdoor", subtitle: "Wytrzymałość w swobodnym tempie", kind: "cycling", environment: "outdoor", intensity: "moderate", durationMinutes: 90 },
    { title: "Szybki spacer", subtitle: "Marsz w równym rytmie", kind: "walking", environment: "outdoor", intensity: "moderate", durationMinutes: 50 },
    { title: "Siła funkcjonalna", subtitle: "Przygotowanie do aktywności w terenie", kind: "strength", environment: "indoor", intensity: "moderate", durationMinutes: 45 },
    { title: "Hike terenowy", subtitle: "Wędrówka po zróżnicowanym podłożu", kind: "hiking", environment: "outdoor", intensity: "moderate", durationMinutes: 150 },
    { title: "Jazda outdoor · technika", subtitle: "Kadencja, zakręty i płynność", kind: "cycling", environment: "outdoor", intensity: "moderate", durationMinutes: 70 },
    { title: "Mobilność", subtitle: "Praca nad zakresem ruchu", kind: "mobility", environment: "indoor", intensity: "easy", durationMinutes: 25 },
    { title: "Spacer regeneracyjny", subtitle: "Bardzo spokojne tempo", kind: "walking", environment: "outdoor", intensity: "easy", durationMinutes: 35 },
  ],
  recovery: [
    { title: "Spacer regeneracyjny", subtitle: "Spokojny ruch na zewnątrz", kind: "walking", environment: "outdoor", intensity: "easy", durationMinutes: 35 },
    { title: "Mobilność i oddech", subtitle: "Łagodna praca całego ciała", kind: "mobility", environment: "indoor", intensity: "easy", durationMinutes: 25 },
    { title: "Lekki rower indoor", subtitle: "Swobodne kręcenie bez presji", kind: "cycling", environment: "indoor", intensity: "easy", durationMinutes: 40 },
    { title: "Aktywna regeneracja", subtitle: "Rozluźnienie i spokojny oddech", kind: "recovery", environment: "indoor", intensity: "easy", durationMinutes: 30 },
    { title: "Dłuższy spacer", subtitle: "Równe, komfortowe tempo", kind: "walking", environment: "outdoor", intensity: "easy", durationMinutes: 60 },
    { title: "Lekka siła", subtitle: "Technika i stabilizacja bez zmęczenia", kind: "strength", environment: "indoor", intensity: "easy", durationMinutes: 35 },
    { title: "Łatwy hike", subtitle: "Spokojna wędrówka w terenie", kind: "hiking", environment: "outdoor", intensity: "easy", durationMinutes: 90 },
  ],
};

export function spreadSessionDays(sessionCount: number) {
  if (sessionCount < 1 || sessionCount > 14) throw new Error("Invalid session count");
  if (sessionCount === 1) return [2];
  return Array.from(
    { length: sessionCount },
    (_, index) => Math.round((index * 6) / (sessionCount - 1)),
  );
}

export function generateWeeklyTrainingPlan(
  weekDate: string,
  sessionCount: number,
  focus: PlanFocus,
): GeneratedTrainingSession[] {
  const weekStart = startOfWeekISO(weekDate);
  const days = spreadSessionDays(sessionCount);
  const focusTemplates = templates[focus];
  return days.map((day, index) => ({
    ...focusTemplates[index % focusTemplates.length],
    scheduledFor: addDaysISO(weekStart, day),
  }));
}
