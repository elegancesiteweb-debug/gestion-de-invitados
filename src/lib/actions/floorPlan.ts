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

const MAX_IMAGE_BYTES = 4 * 1024 * 1024;

export async function uploadFloorPlanImage(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen (los PDF se convierten en el navegador antes de subirse)");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen no puede pesar más de 4MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.event.update({
    where: { id: eventId },
    data: { floorPlanImage: buffer, floorPlanImageType: file.type },
  });
  await logActivity(eventId, "Subió un plano/imagen del salón");

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function removeFloorPlanImage(eventId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.event.update({
    where: { id: eventId },
    data: { floorPlanImage: null, floorPlanImageType: null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function saveFloorPlanData(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const raw = (formData.get("data") as string | null) ?? "[]";
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error("Datos del plano inválidos");
  }
  if (!Array.isArray(parsed)) {
    throw new Error("Datos del plano inválidos");
  }

  await prisma.event.update({
    where: { id: eventId },
    data: { floorPlanData: parsed },
  });
  await logActivity(eventId, "Guardó el diseño del plano del salón");

  revalidatePath(`/dashboard/events/${eventId}`);
}
