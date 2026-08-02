// Días restantes hasta `date` (negativo si ya pasó). Redondeado hacia arriba para que
// "hoy mismo, unas horas antes de medianoche" siga contando como 1 día restante, no 0.
export function daysUntil(date: Date, now: Date = new Date()): number {
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.ceil((date.getTime() - now.getTime()) / msPerDay);
}

// Extiende el acceso `durationMonths` meses a partir de lo que quede vigente: si todavía no
// vence, se suma al tiempo restante (no se pierde nada ya pagado); si ya venció, se cuenta
// desde hoy.
export function extendAccess(
  currentExpiresAt: Date | null,
  durationMonths: number,
  now: Date = new Date()
): Date {
  const base = currentExpiresAt && currentExpiresAt > now ? currentExpiresAt : now;
  const next = new Date(base);
  next.setMonth(next.getMonth() + durationMonths);
  return next;
}
