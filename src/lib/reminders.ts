import type { Event, Guest } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { sendRsvpEmail, resolveResendCredentials } from "@/lib/email";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { formatDate } from "@/lib/dates";

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
  const organizer = await prisma.organizer.findUniqueOrThrow({ where: { id: event.organizerId } });
  const { apiKey, fromEmail } = resolveResendCredentials(organizer);

  const results = await Promise.allSettled(
    eligible.map(async (guest) => {
      await sendRsvpEmail({
        to: guest.email as string,
        template,
        guestName: guest.name,
        eventTitle: event.title,
        eventDate: formatDate(event.eventDate),
        location: event.location,
        tableName: guest.tableName,
        maxCompanions: guest.maxCompanions,
        confirmUrl: `${baseUrl}/c/${guest.token}`,
        invitationUrl: guest.invitationLinkUrl ?? event.invitationLinkUrl,
        apiKey,
        fromEmail,
      });
      await prisma.guest.update({
        where: { id: guest.id },
        data: { reminderSentAt: new Date() },
      });
    })
  );

  return results.filter((r) => r.status === "fulfilled").length;
}
