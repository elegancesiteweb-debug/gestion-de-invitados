import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";
import {
  buildSeatOccupants,
  calcTableOccupancy,
  shapeDimensions,
  rectSeatPosition,
  roundSeatPosition,
} from "@/lib/tables";

const SEAT_MARGIN = 22;

export default async function PrintTablesPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.user.id },
    include: {
      tables: { orderBy: { name: "asc" } },
      guests: { orderBy: { name: "asc" }, include: { companions: true } },
    },
  });

  if (!event) {
    notFound();
  }

  const unassigned = event.guests.filter((g) => g.tableId == null);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/events/${eventId}?tab=mesas`}
          className="text-sm text-gold-dark hover:underline"
        >
          ← Volver al evento
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Plano de mesas · {formatDate(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="mt-1 text-xs text-ink-light">
          {event.tables.length} mesa(s) · {event.guests.length} invitado(s)
        </p>
      </header>

      <div className="flex flex-wrap justify-center gap-8">
        {event.tables.map((table) => {
          const { width, height } = shapeDimensions(table.shape, table.seats);
          const occupancy = calcTableOccupancy(table.id, event.guests);
          const overCapacity = occupancy > table.seats;
          const occupants = buildSeatOccupants(table.id, event.guests);
          const wrapperWidth = width + 2 * SEAT_MARGIN;
          const wrapperHeight = height + 2 * SEAT_MARGIN;
          const circleCenter = wrapperWidth / 2;
          const seatRadius = width / 2 + 18;

          return (
            <div
              key={table.id}
              className="break-inside-avoid text-center"
              style={{ width: wrapperWidth }}
            >
              <div className="relative mx-auto" style={{ width: wrapperWidth, height: wrapperHeight }}>
                <div
                  className={`absolute flex flex-col items-center justify-center border-2 bg-warm/60 ${
                    table.shape === "ROUND" ? "rounded-full" : "rounded-xl"
                  } ${overCapacity ? "border-danger/60" : "border-gold/40"}`}
                  style={{ left: SEAT_MARGIN, top: SEAT_MARGIN, width, height }}
                >
                  <p className="text-sm font-medium text-ink">{table.name}</p>
                  <p className={`text-xs ${overCapacity ? "text-danger" : "text-ink-muted"}`}>
                    {occupancy}/{table.seats}
                  </p>
                </div>

                {Array.from({ length: table.seats }, (_, i) => {
                  const seat =
                    table.shape === "ROUND"
                      ? roundSeatPosition(seatRadius, circleCenter, i, table.seats)
                      : (() => {
                          const p = rectSeatPosition(width, height, 18, i, table.seats);
                          return { x: SEAT_MARGIN + p.x, y: SEAT_MARGIN + p.y };
                        })();
                  return (
                    <div
                      key={i}
                      className="absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap rounded-full border border-gold/20 bg-white px-1.5 py-0.5 text-[10px] text-ink"
                      style={{ left: seat.x, top: seat.y }}
                    >
                      {occupants[i] ?? ""}
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>

      {event.tables.length === 0 && (
        <p className="text-center text-sm text-ink-muted">Todavía no hay mesas creadas.</p>
      )}

      {unassigned.length > 0 && (
        <section className="mt-10 border-t border-gold/15 pt-4">
          <h2 className="mb-2 font-serif text-lg font-medium text-ink">
            Sin mesa asignada ({unassigned.length})
          </h2>
          <p className="text-sm text-ink-muted">
            {unassigned.map((g) => g.name).join(", ")}
          </p>
        </section>
      )}

      <p className="mt-8 text-center text-xs text-ink-light">
        Generado el {formatDate(new Date())}
      </p>
    </div>
  );
}
