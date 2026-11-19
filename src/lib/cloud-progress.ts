export function calculateProgramProgress(statuses: string[]) {
  if (statuses.length === 0) return 0;
  const completed = statuses.filter((status) => status === "completed").length;
  return Math.round((completed / statuses.length) * 100);
}
