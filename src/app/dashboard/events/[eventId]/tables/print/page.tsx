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

  type FloorPlanShape = {
    id: string;
    type: "freehand" | "rect" | "circle" | "text";
    label?: string;
    color: string;
    points?: number[];
    x?: number;
    y?: number;
    width?: number;
    height?: number;
    radius?: number;
  };
  const floorPlanShapes: FloorPlanShape[] = Array.isArray(event.floorPlanData)
    ? (event.floorPlanData as unknown as FloorPlanShape[])
    : [];

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

      {(event.floorPlanImageType || floorPlanShapes.length > 0) && (
        <section className="mb-10 break-inside-avoid">
          <h2 className="mb-2 text-center font-serif text-lg font-medium text-ink">Plano del salón</h2>
          <div className="relative mx-auto overflow-hidden rounded-lg border border-gold/20" style={{ width: 700, height: 500 }}>
            {event.floorPlanImageType && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={`/api/events/${eventId}/floor-plan-image`}
                alt=""
                className="absolute inset-0 h-full w-full object-contain opacity-90"
              />
            )}
            <svg className="absolute inset-0 h-full w-full" viewBox="0 0 700 500">
              {floorPlanShapes
                .filter((s) => s.type === "freehand")
                .map((s) => (
                  <polyline
                    key={s.id}
                    points={(s.points ?? []).reduce<string>(
                      (acc, val, i) => (i % 2 === 0 ? `${acc} ${val},` : `${acc}${val}`),
                      ""
                    )}
                    fill="none"
                    stroke={s.color}
                    strokeWidth={3}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
            </svg>
            {floorPlanShapes
              .filter((s) => s.type === "rect")
              .map((s) => {
                const width = s.width ?? 0;
                const height = s.height ?? 0;
                const left = width < 0 ? (s.x ?? 0) + width : s.x ?? 0;
                const top = height < 0 ? (s.y ?? 0) + height : s.y ?? 0;
                return (
                  <div
                    key={s.id}
                    className="absolute rounded border-2 text-[11px] font-medium"
                    style={{
                      left,
                      top,
                      width: Math.abs(width),
                      height: Math.abs(height),
                      borderColor: s.color,
                      backgroundColor: `${s.color}22`,
                      color: s.color,
                      padding: 4,
                    }}
                  >
                    {s.label}
                  </div>
                );
              })}
            {floorPlanShapes
              .filter((s) => s.type === "circle")
              .map((s) => {
                const radius = s.radius ?? 0;
                return (
                  <div
                    key={s.id}
                    className="absolute flex items-center justify-center rounded-full border-2 text-center text-[11px] font-medium"
                    style={{
                      left: (s.x ?? 0) - radius,
                      top: (s.y ?? 0) - radius,
                      width: radius * 2,
                      height: radius * 2,
                      borderColor: s.color,
                      backgroundColor: `${s.color}22`,
                      color: s.color,
                    }}
                  >
                    {s.label}
                  </div>
                );
              })}
            {floorPlanShapes
              .filter((s) => s.type === "text")
              .map((s) => (
                <div
                  key={s.id}
                  className="absolute text-sm font-semibold"
                  style={{ left: s.x, top: s.y, color: s.color }}
                >
                  {s.label}
                </div>
              ))}
          </div>
        </section>
      )}

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
