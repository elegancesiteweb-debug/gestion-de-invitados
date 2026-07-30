import type { EventStatus } from "@prisma/client";

const STATUS_LABELS: Record<EventStatus, string> = {
  PLANNING: "Planeación",
  CONFIRMED: "Confirmado",
  COMPLETED: "Completado",
  CANCELLED: "Cancelado",
};

const STATUS_STYLES: Record<EventStatus, string> = {
  PLANNING: "bg-warm text-ink-muted",
  CONFIRMED: "bg-gold/15 text-gold-dark",
  COMPLETED: "bg-success-bg text-success",
  CANCELLED: "bg-danger-bg text-danger",
};

export function EventStatusBadge({ status }: { status: EventStatus }) {
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
