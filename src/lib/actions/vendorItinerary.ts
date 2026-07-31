"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/actions/authz";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

async function requireEventVendorOwnedByOrganizer(eventId: string, eventVendorId: string, organizerId: string) {
  const eventVendor = await prisma.eventVendor.findFirst({
    where: { id: eventVendorId, eventId, event: { organizerId } },
  });
  if (!eventVendor) {
    throw new Error("Proveedor no encontrado");
  }
  return eventVendor;
}

export async function createVendorItineraryItem(eventId: string, eventVendorId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventVendorOwnedByOrganizer(eventId, eventVendorId, organizerId);

  const time = (formData.get("time") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();
  const notes = (formData.get("notes") as string | null)?.trim();

  if (!time) {
    throw new Error("La hora es requerida");
  }
  if (!title) {
    throw new Error("El título es requerido");
  }

  await prisma.vendorItineraryItem.create({
    data: { eventVendorId, time, title, notes: notes || null },
  });

  revalidatePath(`/dashboard/events/${eventId}/vendors/${eventVendorId}`);
}

export async function deleteVendorItineraryItem(eventId: string, eventVendorId: string, itemId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventVendorOwnedByOrganizer(eventId, eventVendorId, organizerId);

  await prisma.vendorItineraryItem.deleteMany({
    where: { id: itemId, eventVendorId },
  });

  revalidatePath(`/dashboard/events/${eventId}/vendors/${eventVendorId}`);
}

export async function importVendorItineraryCsv(eventId: string, eventVendorId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventVendorOwnedByOrganizer(eventId, eventVendorId, organizerId);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Archivo CSV requerido");
  }

  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows = data
    .map((row) => ({
      time: (row.time || row.hora || "").trim(),
      title: (row.title || row.actividad || "").trim(),
      notes: (row.notes || row.notas || "").trim(),
    }))
    .filter((row) => row.time.length > 0 && row.title.length > 0);

  if (rows.length === 0) {
    throw new Error("El CSV no contiene momentos válidos (se requieren columnas 'time'/'hora' y 'title'/'actividad')");
  }

  await prisma.vendorItineraryItem.createMany({
    data: rows.map((row) => ({
      eventVendorId,
      time: row.time,
      title: row.title,
      notes: row.notes || null,
    })),
  });

  revalidatePath(`/dashboard/events/${eventId}/vendors/${eventVendorId}`);
}
