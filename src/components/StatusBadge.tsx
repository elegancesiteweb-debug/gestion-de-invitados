import { getTranslations } from "next-intl/server";

export async function StatusBadge({ status }: { status: string }) {
  const t = await getTranslations("shared");
  const STYLES: Record<string, string> = {
    PENDING: "bg-warning-bg text-warning",
    CONFIRMED: "bg-success-bg text-success",
    DECLINED: "bg-danger-bg text-danger",
  };
  const LABELS: Record<string, string> = {
    PENDING: t("statusPending"),
    CONFIRMED: t("statusConfirmed"),
    DECLINED: t("statusDeclined"),
  };

  return (
    <span
      className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
        STYLES[status] ?? "bg-warm text-ink-muted"
      }`}
    >
      {LABELS[status] ?? status}
    </span>
  );
}
