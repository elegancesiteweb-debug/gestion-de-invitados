import type { Event, Guest } from "@prisma/client";
import { sendAllPendingEmails, sendGuestEmail } from "@/lib/actions/guests";
import { sendRemindersNow } from "@/lib/actions/reminders";
import { getReminderEligibleGuests } from "@/lib/reminders";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { formatDate } from "@/lib/dates";

export function SendsPanel({
  event,
  guests,
  baseUrl,
}: {
  event: Event;
  guests: Guest[];
  baseUrl: string;
}) {
  const template = event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;
  const notSent = guests.filter((g) => !g.invitationSentAt);
  const reminderEligible = getReminderEligibleGuests(event, guests);

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <div>
          <p className="font-medium">{notSent.length} invitado(s) sin contactar</p>
          <p className="text-xs text-ink-muted">
            El mensaje se toma de la plantilla configurada en la pestaña Configuración.
          </p>
        </div>
        <form action={sendAllPendingEmails.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
          >
            Enviar email a pendientes
          </button>
        </form>
      </div>

      {event.reminderDaysAfter != null && (
        <div className="flex items-center justify-between rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <div>
            <p className="font-medium">{reminderEligible.length} invitado(s) listos para recordatorio</p>
            <p className="text-xs text-ink-muted">
              Sin responder hace {event.reminderDaysAfter}+ día(s) desde la invitación o el último
              recordatorio.
            </p>
          </div>
          <form action={sendRemindersNow.bind(null, event.id)}>
            <button
              type="submit"
              disabled={reminderEligible.length === 0}
              className="rounded-lg border border-gold/30 bg-white/70 px-4 py-2 text-sm font-medium text-gold-dark hover:bg-warm disabled:opacity-50"
            >
              Enviar recordatorio ahora
            </button>
          </form>
        </div>
      )}

      {notSent.length === 0 ? (
        <p className="text-sm text-ink-muted">Ya se contactó a todos los invitados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Contacto</th>
                <th className="px-4 py-2">Enviar</th>
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
