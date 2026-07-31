import type { Event, Guest } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { sendAllPendingEmails, sendGuestEmail } from "@/lib/actions/guests";
import { sendRemindersNow } from "@/lib/actions/reminders";
import { getReminderEligibleGuests } from "@/lib/reminders";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { formatDate } from "@/lib/dates";

export async function SendsPanel({
  event,
  guests,
  baseUrl,
}: {
  event: Event;
  guests: Guest[];
  baseUrl: string;
}) {
  const t = await getTranslations("sends");
  const template = event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;
  const notSent = guests.filter((g) => !g.invitationSentAt);
  const reminderEligible = getReminderEligibleGuests(event, guests);

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <div>
          <p className="font-medium">{t("notContacted", { count: notSent.length })}</p>
          <p className="text-xs text-ink-muted">{t("templateHint")}</p>
        </div>
        <form action={sendAllPendingEmails.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("sendToPending")}
          </button>
        </form>
      </div>

      {event.reminderDaysAfter != null && (
        <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <div>
            <p className="font-medium">{t("readyForReminder", { count: reminderEligible.length })}</p>
            <p className="text-xs text-ink-muted">
              {t("reminderHint", { days: event.reminderDaysAfter })}
            </p>
          </div>
          <form action={sendRemindersNow.bind(null, event.id)}>
            <button
              type="submit"
              disabled={reminderEligible.length === 0}
              className="rounded-lg border border-gold/30 bg-white/70 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-warm disabled:opacity-50"
            >
              {t("sendReminderNow")}
            </button>
          </form>
        </div>
      )}

      {notSent.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("allContacted")}</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-2">{t("name")}</th>
                <th className="px-4 py-2">{t("contact")}</th>
                <th className="px-4 py-2">{t("send")}</th>
              </tr>
            </thead>
            <tbody>
              {notSent.map((guest) => {
                const confirmUrl = `${baseUrl}/c/${guest.token}`;
                const whatsappLink = guest.phone
                  ? buildWhatsAppLink(
                      guest.phone,
                      buildRsvpMessage({
                        template,
                        guestName: guest.name,
                        eventTitle: event.title,
                        eventDate: formatDate(event.eventDate),
                        location: event.location,
                        tableName: guest.tableName,
                        maxCompanions: guest.maxCompanions,
                        confirmUrl,
                        invitationUrl: guest.invitationLinkUrl ?? event.invitationLinkUrl,
                      })
                    )
                  : null;

                return (
                  <tr key={guest.id} className="border-t border-gold/15">
                    <td className="px-4 py-2 font-medium">{guest.name}</td>
                    <td className="px-4 py-2 text-xs text-ink-muted">
                      {guest.email || ""} {guest.phone ? `· ${guest.phone}` : ""}
                    </td>
                    <td className="px-4 py-2 space-x-3 whitespace-nowrap">
                      {guest.email && (
                        <form action={sendGuestEmail.bind(null, event.id, guest.id)} className="inline">
                          <button type="submit" className="text-sm text-gold-dark hover:underline">
                            Email
                          </button>
                        </form>
                      )}
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-success hover:underline"
                        >
                          WhatsApp
                        </a>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
