"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { eventSchema } from "@/lib/validations";
import { slugify } from "@/lib/slug";
import { requireWriteAccess } from "@/lib/actions/authz";
import { logActivity } from "@/lib/activityLog";
import type { EventStatus } from "@prisma/client";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

const INDIVIDUAL_EVENT_LIMIT = 1;
const EVENT_STATUSES: EventStatus[] = ["PLANNING", "CONFIRMED", "COMPLETED", "CANCELLED"];

export async function createEvent(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

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

  const leadId = (formData.get("leadId") as string | null)?.trim();
  if (leadId) {
    await prisma.lead.updateMany({
      where: { id: leadId, organizerId },
      data: { convertedEventId: event.id },
    });
  }

  const copyFromEventId = (formData.get("copyFromEventId") as string | null)?.trim();
  if (copyFromEventId) {
    const source = await prisma.event.findFirst({
      where: { id: copyFromEventId, organizerId },
      include: { tasks: true, budgetItems: true },
    });
    if (source) {
      await prisma.$transaction([
        prisma.event.update({
          where: { id: event.id },
          data: { messageTemplate: source.messageTemplate },
        }),
        ...(source.tasks.length > 0
          ? [
              prisma.task.createMany({
                data: source.tasks.map((t) => ({ eventId: event.id, title: t.title, done: false })),
              }),
            ]
          : []),
        ...(source.budgetItems.length > 0
          ? [
              prisma.budgetItem.createMany({
                data: source.budgetItems.map((b) => ({
                  eventId: event.id,
                  category: b.category,
                  estimatedAmount: b.estimatedAmount,
                })),
              }),
            ]
          : []),
      ]);
    }
  }

  revalidatePath("/dashboard");
  redirect(`/dashboard/events/${event.id}`);
}

export async function deleteEvent(eventId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.event.deleteMany({
    where: { id: eventId, organizerId },
  });

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateEventSettings(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const messageTemplate = (formData.get("messageTemplate") as string | null)?.trim() || null;
  const showTableOnRsvp = formData.get("showTableOnRsvp") === "on";
  const askDietaryOnRsvp = formData.get("askDietaryOnRsvp") === "on";
  const askMessageOnRsvp = formData.get("askMessageOnRsvp") === "on";
  const askCompanionNamesOnRsvp = formData.get("askCompanionNamesOnRsvp") === "on";
  const showQrOnConfirmation = formData.get("showQrOnConfirmation") === "on";
  const invitationLinkUrl = (formData.get("invitationLinkUrl") as string | null)?.trim() || null;

  const generalUnlimited = formData.get("generalUnlimited") === "on";
  let generalMaxCompanions: number | null;
  if (generalUnlimited) {
    generalMaxCompanions = null;
  } else {
    const parsedMax = parseInt((formData.get("generalMaxCompanions") as string | null) ?? "", 10);
    generalMaxCompanions = Number.isFinite(parsedMax) && parsedMax >= 0 ? parsedMax : 0;
  }

  const reminderDaysRaw = (formData.get("reminderDaysAfter") as string | null)?.trim();
  const parsedReminderDays = reminderDaysRaw ? parseInt(reminderDaysRaw, 10) : NaN;
  const reminderDaysAfter =
    Number.isFinite(parsedReminderDays) && parsedReminderDays > 0 ? parsedReminderDays : null;

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: {
      messageTemplate,
      showTableOnRsvp,
      askDietaryOnRsvp,
      askMessageOnRsvp,
      askCompanionNamesOnRsvp,
      showQrOnConfirmation,
      invitationLinkUrl,
      generalMaxCompanions,
      reminderDaysAfter,
    },
  });
  await logActivity(eventId, "Actualizó la configuración del evento");

  revalidatePath(`/dashboard/events/${eventId}`);
}

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function uploadEventLogo(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const file = formData.get("logo");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }
  if (file.size > MAX_LOGO_BYTES) {
    throw new Error("La imagen no puede pesar más de 2MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const result = await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { logoImage: buffer, logoImageType: file.type },
  });
  if (result.count === 0) {
    throw new Error("Evento no encontrado");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function removeEventLogo(eventId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { logoImage: null, logoImageType: null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function toggleGeneralRsvp(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const enable = formData.get("enable") === "true";

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { publicRsvpToken: enable ? nanoid(12) : null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function toggleClientPortal(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const enable = formData.get("enable") === "true";

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { clientPortalToken: enable ? nanoid(12) : null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function toggleEventCalendar(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const enable = formData.get("enable") === "true";

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { calendarToken: enable ? nanoid(12) : null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function updateEventStatus(eventId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const status = formData.get("status") as EventStatus | null;
  if (!status || !EVENT_STATUSES.includes(status)) {
    throw new Error("Estado inválido");
  }

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { status },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
  revalidatePath("/dashboard");
}
