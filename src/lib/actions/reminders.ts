"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sendEventReminders } from "@/lib/reminders";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function sendRemindersNow(eventId: string) {
  const organizerId = await requireOrganizerId();

  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
  if (!event) {
    throw new Error("Evento no encontrado");
  }

  await sendEventReminders(eventId);

  revalidatePath(`/dashboard/events/${eventId}`);
}
