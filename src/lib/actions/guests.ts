"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { guestSchema } from "@/lib/validations";
import { sendRsvpEmail } from "@/lib/email";

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

export async function createGuest(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const parsed = guestSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email") || undefined,
    phone: formData.get("phone") || undefined,
    maxCompanions: formData.get("maxCompanions") || 0,
  });

  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Datos inválidos");
  }

  const { name, email, phone, maxCompanions } = parsed.data;

  await prisma.guest.create({
    data: {
      eventId,
      name,
      email: email || null,
      phone: phone || null,
      maxCompanions,
      token: nanoid(12),
    },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteGuest(eventId: string, guestId: string) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.guest.deleteMany({
    where: { id: guestId, eventId },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function importGuestsCsv(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Archivo CSV requerido");
  }

  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows = data
    .map((row) => ({
      name: (row.name || row.nombre || "").trim(),
      email: (row.email || "").trim(),
      phone: (row.phone || row.telefono || row.teléfono || "").trim(),
      maxCompanions: parseInt(row.maxcompanions || row.acompanantes || row.acompañantes || "0", 10) || 0,
    }))
    .filter((row) => row.name.length > 0);

  if (rows.length === 0) {
    throw new Error("El CSV no contiene invitados válidos (se requiere columna 'name' o 'nombre')");
  }

  await prisma.guest.createMany({
    data: rows.map((row) => ({
      eventId,
      name: row.name,
      email: row.email || null,
      phone: row.phone || null,
      maxCompanions: row.maxCompanions,
      token: nanoid(12),
    })),
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function sendGuestEmail(eventId: string, guestId: string) {
  const organizerId = await requireOrganizerId();
  const event = await requireEventOwnedByOrganizer(eventId, organizerId);

  const guest = await prisma.guest.findFirst({ where: { id: guestId, eventId } });
  if (!guest) {
    throw new Error("Invitado no encontrado");
  }
  if (!guest.email) {
    throw new Error("Este invitado no tiene email registrado");
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const confirmUrl = `${baseUrl}/c/${guest.token}`;

  await sendRsvpEmail({
    to: guest.email,
    guestName: guest.name,
    eventTitle: event.title,
    eventDate: event.eventDate.toLocaleDateString("es-ES", {
      dateStyle: "long",
    }),
    location: event.location,
    confirmUrl,
  });

  await prisma.guest.update({
    where: { id: guestId },
    data: { invitationSentAt: new Date() },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function sendAllPendingEmails(eventId: string) {
  const organizerId = await requireOrganizerId();
  const event = await requireEventOwnedByOrganizer(eventId, organizerId);

  const pendingGuests = await prisma.guest.findMany({
    where: { eventId, status: "PENDING", email: { not: null } },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  await Promise.allSettled(
    pendingGuests.map(async (guest) => {
      await sendRsvpEmail({
        to: guest.email as string,
        guestName: guest.name,
        eventTitle: event.title,
        eventDate: event.eventDate.toLocaleDateString("es-ES", { dateStyle: "long" }),
        location: event.location,
        confirmUrl: `${baseUrl}/c/${guest.token}`,
      });
      await prisma.guest.update({
        where: { id: guest.id },
        data: { invitationSentAt: new Date() },
      });
    })
  );

  revalidatePath(`/dashboard/events/${eventId}`);
}
