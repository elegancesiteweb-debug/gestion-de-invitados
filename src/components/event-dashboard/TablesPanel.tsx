import type { Guest, Table } from "@prisma/client";
import { SeatingCanvas } from "@/components/event-dashboard/SeatingCanvas";

export function TablesPanel({
  eventId,
  tables,
  guests,
}: {
  eventId: string;
  tables: Table[];
  guests: Guest[];
}) {
  return <SeatingCanvas eventId={eventId} initialTables={tables} initialGuests={guests} />;
}
