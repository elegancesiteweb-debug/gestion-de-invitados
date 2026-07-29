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
