import type { Event, Guest } from "@prisma/client";
import { sendAllPendingEmails, sendGuestEmail } from "@/lib/actions/guests";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";

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

  return (
    <div className="space-y-6 py-6">
      <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-4">
        <div>
          <p className="font-medium">{notSent.length} invitado(s) sin contactar</p>
          <p className="text-xs text-gray-500">
            El mensaje se toma de la plantilla configurada en la pestaña Configuración.
          </p>
        </div>
        <form action={sendAllPendingEmails.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Enviar email a pendientes
          </button>
        </form>
      </div>

      {notSent.length === 0 ? (
        <p className="text-sm text-gray-500">Ya se contactó a todos los invitados.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
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
                        eventDate: event.eventDate.toLocaleDateString("es-ES", { dateStyle: "long" }),
                        location: event.location,
                        tableName: guest.tableName,
                        maxCompanions: guest.maxCompanions,
                        confirmUrl,
                      })
                    )
                  : null;

                return (
                  <tr key={guest.id} className="border-t border-gray-100">
                    <td className="px-4 py-2 font-medium">{guest.name}</td>
                    <td className="px-4 py-2 text-xs text-gray-500">
                      {guest.email || ""} {guest.phone ? `· ${guest.phone}` : ""}
                    </td>
                    <td className="px-4 py-2 space-x-3 whitespace-nowrap">
                      {guest.email && (
                        <form action={sendGuestEmail.bind(null, event.id, guest.id)} className="inline">
                          <button type="submit" className="text-sm text-indigo-600 hover:underline">
                            Email
                          </button>
                        </form>
                      )}
                      {whatsappLink && (
                        <a
                          href={whatsappLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-green-600 hover:underline"
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
