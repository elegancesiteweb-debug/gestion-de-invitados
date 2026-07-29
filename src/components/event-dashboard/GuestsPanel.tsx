import type { Event, Guest } from "@prisma/client";
import {
  createGuest,
  deleteGuest,
  importGuestsCsv,
  sendAllPendingEmails,
  sendGuestEmail,
} from "@/lib/actions/guests";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { DEFAULT_MESSAGE_TEMPLATE } from "@/lib/messageTemplate";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { GuestQrButton } from "@/components/GuestQrButton";

export function GuestsPanel({
  event,
  guests,
  baseUrl,
}: {
  event: Event;
  guests: Guest[];
  baseUrl: string;
}) {
  const tableNames = [...new Set(guests.map((g) => g.tableName).filter(Boolean))] as string[];
  const template = event.messageTemplate || DEFAULT_MESSAGE_TEMPLATE;

  return (
    <div className="space-y-8 py-6">
      <div className="flex flex-wrap items-center gap-3">
        <form action={sendAllPendingEmails.bind(null, event.id)}>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Enviar email a pendientes
          </button>
        </form>
        <details className="rounded-md border border-gray-200 bg-white px-4 py-2">
          <summary className="cursor-pointer text-sm font-medium">Importar CSV</summary>
          <form action={importGuestsCsv.bind(null, event.id)} className="mt-3 space-y-2">
            <p className="text-xs text-gray-500">Columnas: name, email, phone, maxCompanions, mesa</p>
            <input type="file" name="file" accept=".csv" required className="text-sm" />
            <button
              type="submit"
              className="block rounded-md border border-gray-300 px-3 py-1.5 text-sm hover:bg-gray-50"
            >
              Importar
            </button>
          </form>
        </details>
      </div>

      <section>
        <h2 className="mb-3 text-lg font-medium">Agregar invitado</h2>
        <form
          action={createGuest.bind(null, event.id)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input name="name" required className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input name="email" type="email" className="rounded-md border border-gray-300 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Teléfono</label>
            <input
              name="phone"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
              placeholder="+50212345678"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Mesa</label>
            <input
              name="tableName"
              list="table-names"
              placeholder="Mesa 1"
              className="w-28 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
            <datalist id="table-names">
              {tableNames.map((t) => (
                <option key={t} value={t} />
              ))}
            </datalist>
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Acompañantes</label>
            <input
              name="maxCompanions"
              type="number"
              min={0}
              defaultValue={0}
              className="w-20 rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-md bg-indigo-600 px-4 py-1.5 text-sm font-medium text-white hover:bg-indigo-700"
          >
            Agregar
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-medium">Invitados ({guests.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Mesa</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acompañantes</th>
                <th className="px-4 py-2">Confirmación</th>
                <th className="px-4 py-2">Enviar</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {guests.map((guest) => {
                const confirmUrl = `${baseUrl}/c/${guest.token}`;
                const whatsappLink = guest.phone
                  ? buildWhatsAppLink(
                      guest.phone,
                      buildRsvpMessage({
                        template,
                        guestName: guest.name,
                        eventTitle: event.title,
                        eventDate: event.eventDate.toLocaleDateString("es-ES", {
                          dateStyle: "long",
                        }),
                        location: event.location,
                        tableName: guest.tableName,
                        maxCompanions: guest.maxCompanions,
                        confirmUrl,
                      })
                    )
                  : null;

                return (
                  <tr key={guest.id} className="border-t border-gray-100">
                    <td className="px-4 py-2">
                      <p className="font-medium">{guest.name}</p>
                      <p className="text-xs text-gray-500">
                        {guest.email || ""} {guest.phone ? `· ${guest.phone}` : ""}
                      </p>
                    </td>
                    <td className="px-4 py-2 text-gray-600">{guest.tableName || "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={guest.status} />
                    </td>
                    <td className="px-4 py-2">
                      {guest.status === "CONFIRMED"
                        ? `${guest.companionsConfirmed ?? 0}/${guest.maxCompanions}`
                        : `máx. ${guest.maxCompanions}`}
                    </td>
                    <td className="px-4 py-2 space-x-3 whitespace-nowrap">
                      <CopyLinkButton url={confirmUrl} />
                      <GuestQrButton
                        guestName={guest.name}
                        rsvpUrl={confirmUrl}
                        checkinUrl={`${baseUrl}/checkin/${guest.checkinToken}`}
                      />
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
                      {guest.invitationSentAt && (
                        <span className="block text-xs text-gray-400">Enviado</span>
                      )}
                    </td>
                    <td className="px-4 py-2">
                      <form action={deleteGuest.bind(null, event.id, guest.id)}>
                        <button type="submit" className="text-sm text-red-600 hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
