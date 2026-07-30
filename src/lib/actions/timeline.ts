"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
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

async function requireEventOwnedByOrganizer(eventId: string, organizerId: string) {
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
  });
  if (!event) {
    throw new Error("Evento no encontrado");
  }
  return event;
}

export async function createTimelineItem(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const time = (formData.get("time") as string | null)?.trim();
  const title = (formData.get("title") as string | null)?.trim();
  const responsible = (formData.get("responsible") as string | null)?.trim();

  if (!time) {
    throw new Error("La hora es requerida");
  }
  if (!title) {
    throw new Error("El título es requerido");
  }

  await prisma.timelineItem.create({
    data: { eventId, time, title, responsible: responsible || null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteTimelineItem(eventId: string, itemId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.timelineItem.deleteMany({
    where: { id: itemId, eventId },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}
