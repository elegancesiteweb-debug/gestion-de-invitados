import type { Companion, Guest, TableShape } from "@prisma/client";
import { prisma } from "@/lib/prisma";

type GuestWithCompanions = Guest & { companions: Companion[] };

const GRID_COLUMNS = 4;
const GRID_STEP = 180;
const GRID_OFFSET = 80;

export function nextGridPosition(existingTableCount: number): { x: number; y: number } {
  const col = existingTableCount % GRID_COLUMNS;
  const row = Math.floor(existingTableCount / GRID_COLUMNS);
  return { x: GRID_OFFSET + col * GRID_STEP, y: GRID_OFFSET + row * GRID_STEP };
}

export async function findOrCreateTableByName(
  eventId: string,
  rawName: string
): Promise<{ id: string; name: string } | null> {
  const name = rawName.trim();
  if (!name) return null;

  const existing = await prisma.table.findFirst({
    where: { eventId, name: { equals: name, mode: "insensitive" } },
  });
  if (existing) return existing;

  const existingCount = await prisma.table.count({ where: { eventId } });
  const { x, y } = nextGridPosition(existingCount);

  return prisma.table.create({ data: { eventId, name, x, y } });
}

// Geometría pura de una mesa, compartida por el editor interactivo (SeatingCanvas)
// y el plano imprimible (sin interactividad, ambos deben verse iguales).
export function shapeDimensions(shape: TableShape, seats: number): { width: number; height: number } {
  if (shape === "RECT") {
    return { width: Math.min(260, 140 + seats * 8), height: 110 };
  }
  const size = Math.min(180, 90 + seats * 5);
  return { width: size, height: size };
}

// Posición de un asiento sobre el perímetro de un rectángulo (sentido horario
// desde la esquina superior izquierda), desplazado `margin` px hacia afuera del borde.
export function rectSeatPosition(
  width: number,
  height: number,
  margin: number,
  index: number,
  count: number
): { x: number; y: number } {
  const perimeter = 2 * (width + height);
  let dist = (perimeter * index) / count;

  if (dist < width) return { x: dist, y: -margin };
  dist -= width;
  if (dist < height) return { x: width + margin, y: dist };
  dist -= height;
  if (dist < width) return { x: width - dist, y: height + margin };
  dist -= width;
  return { x: -margin, y: height - dist };
}

// Posición de un asiento alrededor de una mesa redonda de radio `seatRadius`,
// centrada en (circleCenter, circleCenter).
export function roundSeatPosition(
  seatRadius: number,
  circleCenter: number,
  index: number,
  count: number
): { x: number; y: number } {
  const angle = (2 * Math.PI * index) / count - Math.PI / 2;
  return {
    x: circleCenter + seatRadius * Math.cos(angle),
    y: circleCenter + seatRadius * Math.sin(angle),
  };
}

export function calcGuestOccupancy(guest: Guest): number {
  return 1 + (guest.status === "CONFIRMED" ? guest.companionsConfirmed ?? 0 : guest.maxCompanions);
}

export function calcTableOccupancy(tableId: string, guests: Guest[]): number {
  return guests
    .filter((guest) => guest.tableId === tableId)
    .reduce((sum, guest) => sum + calcGuestOccupancy(guest), 0);
}

// Etiquetas de asiento en orden: por cada invitado de la mesa, su nombre y
// (si están nombrados) sus acompañantes asistentes, o marcadores genéricos
// si los acompañantes son solo un número.
export function buildSeatOccupants(tableId: string, guests: GuestWithCompanions[]): string[] {
  const labels: string[] = [];

  for (const guest of guests.filter((g) => g.tableId === tableId)) {
    labels.push(guest.name);
    if (guest.companions.length > 0) {
      for (const companion of guest.companions) {
        if (companion.attending) labels.push(companion.name);
      }
    } else {
      const extra = calcGuestOccupancy(guest) - 1;
      for (let i = 0; i < extra; i++) {
        labels.push("+1 invitado");
      }
    }
  }

  return labels;
}
