import type { Guest } from "@prisma/client";
import { prisma } from "@/lib/prisma";

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

export function calcGuestOccupancy(guest: Guest): number {
  return 1 + (guest.status === "CONFIRMED" ? guest.companionsConfirmed ?? 0 : guest.maxCompanions);
}

export function calcTableOccupancy(tableId: string, guests: Guest[]): number {
  return guests
    .filter((guest) => guest.tableId === tableId)
    .reduce((sum, guest) => sum + calcGuestOccupancy(guest), 0);
}
