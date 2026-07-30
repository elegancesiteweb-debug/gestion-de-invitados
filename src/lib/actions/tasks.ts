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
  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId },
  });
  if (!event) {
    throw new Error("Evento no encontrado");
  }
  return event;
}

export async function createTask(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) {
    throw new Error("El título de la tarea es requerido");
  }
  const dueDateRaw = (formData.get("dueDate") as string | null)?.trim();
  const dueDate = dueDateRaw ? new Date(`${dueDateRaw}T12:00:00`) : null;

  await prisma.task.create({
    data: { eventId, title, dueDate },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function toggleTask(eventId: string, taskId: string) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const task = await prisma.task.findFirst({ where: { id: taskId, eventId } });
  if (!task) {
    throw new Error("Tarea no encontrada");
  }

  await prisma.task.update({
    where: { id: taskId },
    data: { done: !task.done },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteTask(eventId: string, taskId: string) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.task.deleteMany({
    where: { id: taskId, eventId },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}
