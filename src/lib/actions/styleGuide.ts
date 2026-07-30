"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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

export async function updateStyleGuide(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const colorPalette = (formData.get("colorPalette") as string | null)?.trim() || null;
  const styleNotes = (formData.get("styleNotes") as string | null)?.trim() || null;

  await prisma.event.update({
    where: { id: eventId },
    data: { colorPalette, styleNotes },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function uploadStyleGuideImage(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen no puede pesar más de 2MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.styleGuideImage.create({
    data: { eventId, image: buffer, imageType: file.type },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteStyleGuideImage(eventId: string, imageId: string) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.styleGuideImage.deleteMany({
    where: { id: imageId, eventId },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}
