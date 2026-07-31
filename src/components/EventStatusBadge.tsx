import type { EventStatus } from "@prisma/client";
import { getTranslations } from "next-intl/server";

const STATUS_STYLES: Record<EventStatus, string> = {
  PLANNING: "bg-warm text-ink-muted",
  CONFIRMED: "bg-gold/15 text-gold-dark",
  COMPLETED: "bg-success-bg text-success",
  CANCELLED: "bg-danger-bg text-danger",
};

export async function EventStatusBadge({ status }: { status: EventStatus }) {
  const t = await getTranslations("shared");
  const STATUS_LABELS: Record<EventStatus, string> = {
    PLANNING: t("eventStatusPlanning"),
    CONFIRMED: t("eventStatusConfirmed"),
    COMPLETED: t("eventStatusCompleted"),
    CANCELLED: t("eventStatusCancelled"),
  };
  return (
    <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${STATUS_STYLES[status]}`}>
      {STATUS_LABELS[status]}
    </span>
  );
}
