const MILESTONE_DAYS = [30, 15, 7, 3, 1, 0];

// Devuelve el umbral de días que coincide exactamente con hoy (30, 15, 7, 3, 1 o 0),
// o null si ningún umbral aplica. Se calcula al vuelo en cada carga de página —
// no hay tarea programada de por medio, así que no depende de un cron.
export function getCountdownMilestone(eventDate: Date, now: Date = new Date()): number | null {
  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const daysUntil = Math.round((startOfDay(eventDate) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  return MILESTONE_DAYS.includes(daysUntil) ? daysUntil : null;
}
