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

export async function createBudgetItem(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const category = (formData.get("category") as string | null)?.trim();
  const estimatedAmount = parseFloat((formData.get("estimatedAmount") as string | null) ?? "");
  const actualRaw = (formData.get("actualAmount") as string | null)?.trim();
  const actualAmount = actualRaw ? parseFloat(actualRaw) : null;

  if (!category) {
    throw new Error("La categoría es requerida");
  }
  if (!Number.isFinite(estimatedAmount) || estimatedAmount < 0) {
    throw new Error("El monto estimado no es válido");
  }
  if (actualAmount !== null && (!Number.isFinite(actualAmount) || actualAmount < 0)) {
    throw new Error("El monto real no es válido");
  }

  await prisma.budgetItem.create({
    data: { eventId, category, estimatedAmount, actualAmount },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function updateBudgetItemActual(eventId: string, itemId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const actualRaw = (formData.get("actualAmount") as string | null)?.trim();
  const actualAmount = actualRaw ? parseFloat(actualRaw) : null;
  if (actualAmount !== null && (!Number.isFinite(actualAmount) || actualAmount < 0)) {
    throw new Error("El monto real no es válido");
  }

  await prisma.budgetItem.updateMany({
    where: { id: itemId, eventId },
    data: { actualAmount },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteBudgetItem(eventId: string, itemId: string) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.budgetItem.deleteMany({
    where: { id: itemId, eventId },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}
