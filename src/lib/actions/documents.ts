"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
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

const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

export async function uploadEventDocument(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona un archivo");
  }
  if (file.size > MAX_DOCUMENT_BYTES) {
    throw new Error("El archivo no puede pesar más de 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const name = (formData.get("name") as string | null)?.trim() || file.name;

  await prisma.eventDocument.create({
    data: {
      eventId,
      name,
      file: buffer,
      fileType: file.type || "application/octet-stream",
      fileSize: file.size,
    },
  });

  await logActivity(eventId, `Subió el documento "${name}"`);
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteEventDocument(eventId: string, documentId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const document = await prisma.eventDocument.findFirst({ where: { id: documentId, eventId } });
  await prisma.eventDocument.deleteMany({ where: { id: documentId, eventId } });
  if (document) {
    await logActivity(eventId, `Eliminó el documento "${document.name}"`);
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}
