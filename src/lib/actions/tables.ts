"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import type { TableShape } from "@prisma/client";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { nextGridPosition } from "@/lib/tables";
import { requireWriteAccess } from "@/lib/actions/authz";
import { logActivity } from "@/lib/activityLog";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

async function requireEventOwnedByOrganizer(eventId: string, organizerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
  if (!event) {
    throw new Error("Evento no encontrado");
  }
  return event;
}

async function requireTableOwnedByOrganizer(tableId: string, organizerId: string) {
  const table = await prisma.table.findFirst({
    where: { id: tableId, event: { organizerId } },
  });
  if (!table) {
    throw new Error("Mesa no encontrada");
  }
  return table;
}

function parseShape(value: FormDataEntryValue | null): TableShape {
  return value === "RECT" ? "RECT" : "ROUND";
}

function parseSeats(value: FormDataEntryValue | null): number {
  const parsed = parseInt((value as string | null) ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 8;
}

export async function createTable(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre de la mesa es requerido");
  }

  const existingCount = await prisma.table.count({ where: { eventId } });
  const { x, y } = nextGridPosition(existingCount);

  await prisma.table.create({
    data: {
      eventId,
      name,
      shape: parseShape(formData.get("shape")),
      seats: parseSeats(formData.get("seats")),
      x,
      y,
    },
  });
  await logActivity(eventId, `Agregó la mesa "${name}"`);

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function updateTableDetails(tableId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  const table = await requireTableOwnedByOrganizer(tableId, organizerId);

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre de la mesa es requerido");
  }

  await prisma.$transaction([
    prisma.table.update({
      where: { id: tableId },
      data: {
        name,
        shape: parseShape(formData.get("shape")),
        seats: parseSeats(formData.get("seats")),
      },
    }),
    prisma.guest.updateMany({ where: { tableId }, data: { tableName: name } }),
  ]);

  revalidatePath(`/dashboard/events/${table.eventId}`);
}

export async function updateTablePosition(tableId: string, x: number, y: number) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  const table = await requireTableOwnedByOrganizer(tableId, organizerId);

  await prisma.table.update({ where: { id: tableId }, data: { x, y } });

  revalidatePath(`/dashboard/events/${table.eventId}`);
}

export async function deleteTable(tableId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  const table = await requireTableOwnedByOrganizer(tableId, organizerId);

  await prisma.$transaction([
    prisma.guest.updateMany({ where: { tableId }, data: { tableId: null, tableName: null } }),
    prisma.table.delete({ where: { id: tableId } }),
  ]);
  await logActivity(table.eventId, `Eliminó la mesa "${table.name}"`);

  revalidatePath(`/dashboard/events/${table.eventId}`);
}

export async function assignGuestToTable(guestId: string, tableId: string | null) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const guest = await prisma.guest.findFirst({
    where: { id: guestId, event: { organizerId } },
  });
  if (!guest) {
    throw new Error("Invitado no encontrado");
  }

  let tableName: string | null = null;
  if (tableId) {
    const table = await prisma.table.findFirst({
      where: { id: tableId, eventId: guest.eventId },
    });
    if (!table) {
      throw new Error("Mesa no encontrada");
    }
    tableName = table.name;
  }

  await prisma.guest.update({
    where: { id: guestId },
    data: { tableId, tableName },
  });

  revalidatePath(`/dashboard/events/${guest.eventId}`);
}
