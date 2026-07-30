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
