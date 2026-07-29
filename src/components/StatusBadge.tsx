const STYLES: Record<string, string> = {
  PENDING: "bg-warning-bg text-warning",
  CONFIRMED: "bg-success-bg text-success",
  DECLINED: "bg-danger-bg text-danger",
};

const LABELS: Record<string, string> = {
  PENDING: "Pendiente",
  CONFIRMED: "Confirmado",
  DECLINED: "No asiste",
};

export function StatusBadge({ status }: { status: string }) {
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
