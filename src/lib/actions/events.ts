"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { slugify } from "@/lib/slug";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

const INDIVIDUAL_EVENT_LIMIT = 1;

export async function createEvent(formData: FormData) {
  const organizerId = await requireOrganizerId();

  const parsed = eventSchema.safeParse({
    title: formData.get("title"),
    description: formData.get("description") || undefined,
    eventDate: formData.get("eventDate"),
    location: formData.get("location") || undefined,
    notes: formData.get("notes") || undefined,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { title, description, eventDate, location, notes } = parsed.data;

  const organizer = await prisma.organizer.findUniqueOrThrow({ where: { id: organizerId } });

  if (organizer.accountType === "INDIVIDUAL") {
    const claim = await prisma.organizer.updateMany({
      where: { id: organizerId, eventsCreatedCount: { lt: INDIVIDUAL_EVENT_LIMIT } },
      data: { eventsCreatedCount: { increment: 1 } },
    });
    if (claim.count === 0) {
      throw new Error(
        "Tu plan permite un solo evento. Contáctanos para pasar a plan Wedding Planner."
      );
    }
  } else {
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { eventsCreatedCount: { increment: 1 } },
    });
  }

  const event = await prisma.event.create({
    data: {
      organizerId,
      title,
      description,
      location,
      notes,
      eventDate: new Date(eventDate),
      slug: slugify(title),
    },
  });

  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${event.id}`);
}

export async function deleteEvent(eventId: string) {
  const organizerId = await requireOrganizerId();

  await prisma.event.deleteMany({
    where: { id: eventId, organizerId },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateEventSettings(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();

  const messageTemplate = (formData.get("messageTemplate") as string | null)?.trim() || null;
  const showTableOnRsvp = formData.get("showTableOnRsvp") === "on";

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { messageTemplate, showTableOnRsvp },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}
