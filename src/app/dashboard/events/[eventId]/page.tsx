import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import {
  createGuest,
  deleteGuest,
  importGuestsCsv,
  sendAllPendingEmails,
  sendGuestEmail,
} from "@/lib/actions/guests";
import { deleteEvent } from "@/lib/actions/events";
import { buildWhatsAppLink, buildRsvpMessage } from "@/lib/whatsapp";
import { StatusBadge } from "@/components/StatusBadge";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { GuestQrButton } from "@/components/GuestQrButton";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.user.id },
    include: { guests: { orderBy: { createdAt: "asc" } } },
  });

  if (!event) {
    notFound();
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce(
    (sum, g) => sum + 1 + (g.companionsConfirmed ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-indigo-600 hover:underline">
        ← Tus eventos
      </Link>

      <div className="mt-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{event.title}</h1>
          <p className="text-sm text-gray-500">
            {event.eventDate.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
            {event.location ? ` · ${event.location}` : ""}
          </p>
        </div>
        <form action={deleteEvent.bind(null, event.id)}>
          <button
            type="submit"
            className="text-sm text-red-600 hover:underline"
          >
            Eliminar evento
          </button>
        </form>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard label="Confirmados" value={confirmed.length} />
        <StatCard label="No asisten" value={declined.length} />
        <StatCard label="Pendientes" value={pending.length} />
        <StatCard label="Total asistentes" value={totalAttendees} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
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
          <form
            action={importGuestsCsv.bind(null, event.id)}
            className="mt-3 space-y-2"
          >
            <p className="text-xs text-gray-500">
              Columnas: name, email, phone, maxCompanions
            </p>
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

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Agregar invitado</h2>
        <form
          action={createGuest.bind(null, event.id)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-200 bg-white p-4"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input
              name="name"
              required
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              className="rounded-md border border-gray-300 px-2 py-1.5 text-sm"
            />
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

      <section className="mt-8">
        <h2 className="mb-3 text-lg font-medium">Invitados ({event.guests.length})</h2>
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-2">Nombre</th>
                <th className="px-4 py-2">Estado</th>
                <th className="px-4 py-2">Acompañantes</th>
                <th className="px-4 py-2">Confirmación</th>
                <th className="px-4 py-2">Enviar</th>
                <th className="px-4 py-2"></th>
              </tr>
            </thead>
            <tbody>
              {event.guests.map((guest) => {
                const confirmUrl = `${baseUrl}/c/${guest.token}`;
                const whatsappLink = guest.phone
                  ? buildWhatsAppLink(
                      guest.phone,
                      buildRsvpMessage({
                        guestName: guest.name,
                        eventTitle: event.title,
                        eventDate: event.eventDate.toLocaleDateString("es-ES", {
                          dateStyle: "long",
                        }),
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
                      <GuestQrButton url={confirmUrl} guestName={guest.name} />
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

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border border-gray-200 bg-white p-4 text-center">
      <p className="text-2xl font-semibold">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );
}
