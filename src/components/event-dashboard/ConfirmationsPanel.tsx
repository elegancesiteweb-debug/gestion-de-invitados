import Link from "next/link";
import type { Companion, Guest } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { ConfirmationsList } from "@/components/event-dashboard/ConfirmationsList";

export async function ConfirmationsPanel({
  eventId,
  guests,
}: {
  eventId: string;
  guests: (Guest & { companions: Companion[] })[];
}) {
  const t = await getTranslations("confirmations");
  const responded = guests
    .filter((g) => g.respondedAt !== null)
    .sort((a, b) => (b.respondedAt as Date).getTime() - (a.respondedAt as Date).getTime());

  if (responded.length === 0) {
    return <div className="py-10 text-center text-sm text-ink-muted">{t("empty")}</div>;
  }

  return (
    <div className="space-y-3 py-6">
      <div className="flex justify-end gap-4">
        <a
          href={`/api/events/${eventId}/export-csv`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("downloadCsv")}
        </a>
        <Link
          href={`/dashboard/events/${eventId}/print`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("exportPrint")}
        </Link>
      </div>

      <ConfirmationsList eventId={eventId} responded={responded} />
    </div>
  );
}
