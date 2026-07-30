"use server";

import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { prisma } from "@/lib/prisma";
import { rsvpSchema, generalRsvpSchema } from "@/lib/validations";
import { notifyOrganizer } from "@/lib/email";

function parseCompanionRows(
  formData: FormData,
  cap: number
): { name: string; attending: boolean }[] {
  const countRaw = formData.get("companionCount");
  const parsedCount = countRaw ? parseInt(countRaw as string, 10) : 0;
  const count = Number.isFinite(parsedCount) ? Math.max(0, Math.min(parsedCount, cap)) : 0;

  const rows: { name: string; attending: boolean }[] = [];
  for (let i = 0; i < count; i++) {
    const name = (formData.get(`companion_${i}_name`) as string | null)?.trim();
    if (!name) continue;
    rows.push({ name, attending: formData.get(`companion_${i}_attending`) === "on" });
  }
  return rows;
}

export async function submitRsvp(token: string, formData: FormData) {
  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { event: { include: { organizer: true } } },
  });
  if (!guest) {
    return { error: "Invitación no encontrada" };
  }

  const parsed = rsvpSchema.safeParse({
    status: formData.get("status"),
    companionsConfirmed: formData.get("companionsConfirmed") || 0,
    messageFromGuest: formData.get("messageFromGuest") || undefined,
    dietaryNotes: formData.get("dietaryNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { status, messageFromGuest, dietaryNotes } = parsed.data;
  let { companionsConfirmed } = parsed.data;

  const useNamedCompanions = status === "CONFIRMED" && guest.event.askCompanionNamesOnRsvp;
  const companionRows = useNamedCompanions ? parseCompanionRows(formData, guest.maxCompanions) : [];
  if (useNamedCompanions) {
    companionsConfirmed = companionRows.filter((r) => r.attending).length;
  }

  if (companionsConfirmed > guest.maxCompanions) {
    return {
      error: `Puedes confirmar como máximo ${guest.maxCompanions} acompañante(s)`,
    };
  }

  await prisma.$transaction([
    prisma.guest.update({
      where: { token },
      data: {
        status,
        companionsConfirmed: status === "CONFIRMED" ? companionsConfirmed : 0,
        messageFromGuest: messageFromGuest || null,
        dietaryNotes: status === "CONFIRMED" ? dietaryNotes || null : null,
        respondedAt: new Date(),
      },
    }),
    prisma.companion.deleteMany({ where: { guestId: guest.id } }),
    ...(companionRows.length > 0
      ? [
          prisma.companion.createMany({
            data: companionRows.map((row) => ({ ...row, guestId: guest.id })),
          }),
        ]
      : []),
  ]);

  revalidatePath(`/c/${token}`);

  await notifyOrganizer(
    guest.event.organizer,
    `Nueva respuesta: ${guest.event.title}`,
    `${guest.name} ${status === "CONFIRMED" ? "confirmó su asistencia" : "no asistirá"} a ${guest.event.title}.`
  );

  return { ok: true };
}

export async function submitGeneralRsvp(publicRsvpToken: string, formData: FormData) {
  const event = await prisma.event.findUnique({
    where: { publicRsvpToken },
    include: { organizer: true },
  });
  if (!event) {
    return { error: "Formulario no encontrado" };
  }

  const parsed = generalRsvpSchema.safeParse({
    name: formData.get("name"),
    status: formData.get("status"),
    companionsConfirmed: formData.get("companionsConfirmed") || 0,
    messageFromGuest: formData.get("messageFromGuest") || undefined,
    dietaryNotes: formData.get("dietaryNotes") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { name, status, messageFromGuest, dietaryNotes } = parsed.data;
  let { companionsConfirmed } = parsed.data;

  const useNamedCompanions = status === "CONFIRMED" && event.askCompanionNamesOnRsvp;
  const companionRows = useNamedCompanions
    ? parseCompanionRows(formData, event.generalMaxCompanions ?? Infinity)
    : [];
  if (useNamedCompanions) {
    companionsConfirmed = companionRows.filter((r) => r.attending).length;
  }

  if (event.generalMaxCompanions !== null && companionsConfirmed > event.generalMaxCompanions) {
    return {
      error: `Puedes confirmar como máximo ${event.generalMaxCompanions} acompañante(s)`,
    };
  }

  const newGuest = await prisma.guest.create({
    data: {
      eventId: event.id,
      name,
      maxCompanions: event.generalMaxCompanions ?? companionsConfirmed,
      status,
      companionsConfirmed: status === "CONFIRMED" ? companionsConfirmed : 0,
      messageFromGuest: messageFromGuest || null,
      dietaryNotes: status === "CONFIRMED" ? dietaryNotes || null : null,
      respondedAt: new Date(),
      token: nanoid(12),
      checkinToken: nanoid(12),
      companions:
        companionRows.length > 0
          ? { createMany: { data: companionRows.map(({ name, attending }) => ({ name, attending })) } }
          : undefined,
    },
  });

  revalidatePath(`/g/${publicRsvpToken}`);

  await notifyOrganizer(
    event.organizer,
    `Nueva respuesta: ${event.title}`,
    `${name} ${status === "CONFIRMED" ? "confirmó su asistencia" : "no asistirá"} a ${event.title}.`
  );

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  return { ok: true, checkinUrl: `${baseUrl}/checkin/${newGuest.checkinToken}` };
}
