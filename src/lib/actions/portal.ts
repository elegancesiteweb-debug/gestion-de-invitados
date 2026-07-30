"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";

async function requireEventByClientPortalToken(clientPortalToken: string) {
  const event = await prisma.event.findUnique({ where: { clientPortalToken } });
  if (!event) {
    throw new Error("Portal no encontrado");
  }
  return event;
}

export async function submitClientComment(clientPortalToken: string, formData: FormData) {
  const event = await requireEventByClientPortalToken(clientPortalToken);

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) {
    throw new Error("Escribe un mensaje");
  }

  await prisma.clientComment.create({ data: { eventId: event.id, body } });

  revalidatePath(`/portal/${clientPortalToken}`);
}

export async function setVendorApproval(
  clientPortalToken: string,
  eventVendorId: string,
  approved: boolean
) {
  const event = await requireEventByClientPortalToken(clientPortalToken);

  await prisma.eventVendor.updateMany({
    where: { id: eventVendorId, eventId: event.id },
    data: { clientApproved: approved },
  });

  revalidatePath(`/portal/${clientPortalToken}`);
}

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function uploadInspirationImage(clientPortalToken: string, formData: FormData) {
  const event = await requireEventByClientPortalToken(clientPortalToken);

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
    data: { eventId: event.id, image: buffer, imageType: file.type, uploadedBy: "CLIENT" },
  });

  revalidatePath(`/portal/${clientPortalToken}`);
}

export async function deleteInspirationImage(clientPortalToken: string, imageId: string) {
  const event = await requireEventByClientPortalToken(clientPortalToken);

  await prisma.styleGuideImage.deleteMany({
    where: { id: imageId, eventId: event.id },
  });

  revalidatePath(`/portal/${clientPortalToken}`);
}
