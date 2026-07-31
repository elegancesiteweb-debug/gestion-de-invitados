import Link from "next/link";
import type { Companion, Guest, Table } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { SeatingCanvas } from "@/components/event-dashboard/SeatingCanvas";

export async function TablesPanel({
  eventId,
  tables,
  guests,
}: {
  eventId: string;
  tables: Table[];
  guests: (Guest & { companions: Companion[] })[];
}) {
  const t = await getTranslations("tables");
  return (
    <div>
      <div className="flex justify-end pt-6">
        <Link
          href={`/dashboard/events/${eventId}/tables/print`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("printPlan")}
        </Link>
      </div>
      <SeatingCanvas eventId={eventId} initialTables={tables} initialGuests={guests} />
    </div>
  );
}
