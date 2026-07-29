import type { Event, Guest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendRsvpEmail } from "@/lib/email";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";

export function isGuestReminderEligible(event: Event, guest: Guest, now: Date = new Date()): boolean {
  if (event.reminderDaysAfter == null) return false;
  if (guest.status !== "PENDING") return false;
  if (!guest.email) return false;
  if (!guest.invitationSentAt) return false;

  const lastContact = guest.reminderSentAt ?? guest.invitationSentAt;
  const msSinceContact = now.getTime() - lastContact.getTime();
  const thresholdMs = event.reminderDaysAfter * 24 * 60 * 60 * 1000;
  return msSinceContact >= thresholdMs;
}

export function getReminderEligibleGuests(event: Event, guests: Guest[], now: Date = new Date()): Guest[] {
  return guests.filter((guest) => isGuestReminderEligible(event, guest, now));
}

export async function sendEventReminders(eventId: string): Promise<number> {
  const event = await prisma.event.findUnique({
    where: { id: eventId },
    include: { guests: true },
  });
  if (!event || event.reminderDaysAfter == null) return 0;

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const template = event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;
  const eligible = getReminderEligibleGuests(event, event.guests);

  const results = await Promise.allSettled(
    eligible.map(async (guest) => {
      await sendRsvpEmail({
        to: guest.email as string,
        template,
        guestName: guest.name,
        eventTitle: event.title,
        eventDate: event.eventDate.toLocaleDateString("es-ES", { dateStyle: "long" }),
        location: event.location,
        tableName: guest.tableName,
        maxCompanions: guest.maxCompanions,
        confirmUrl: `${baseUrl}/c/${guest.token}`,
      });
      await prisma.guest.update({
        where: { id: guest.id },
        data: { reminderSentAt: new Date() },
      });
    })
  );

  return results.filter((r) => r.status === "fulfilled").length;
}

export async function sendRemindersForAllEvents(): Promise<{ eventsProcessed: number; remindersSent: number }> {
  const events = await prisma.event.findMany({
    where: { reminderDaysAfter: { not: null } },
    select: { id: true },
  });

  let remindersSent = 0;
  for (const event of events) {
    remindersSent += await sendEventReminders(event.id);
  }

  return { eventsProcessed: events.length, remindersSent };
}
