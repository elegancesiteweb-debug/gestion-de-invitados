export const APP_TIMEZONE = "America/Mexico_City";

export function formatInAppTimezone(date: Date, options: Intl.DateTimeFormatOptions): string {
  return date.toLocaleString("es-ES", { ...options, timeZone: APP_TIMEZONE });
}

export function formatDate(date: Date, dateStyle: "long" | "medium" | "short" = "long"): string {
  return formatInAppTimezone(date, { dateStyle });
}

export function formatDateTime(
  date: Date,
  dateStyle: "long" | "medium" | "short" = "long"
): string {
  return formatInAppTimezone(date, { dateStyle, timeStyle: "short" });
}

export function formatTime(date: Date): string {
  return formatInAppTimezone(date, { hour: "2-digit", minute: "2-digit" });
}
