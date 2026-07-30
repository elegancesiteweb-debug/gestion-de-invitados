import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/event-dashboard/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { BrandHeader } from "@/components/BrandHeader";
import { BrandFooter } from "@/components/BrandFooter";
import { formatDateTime } from "@/lib/dates";
import {
  submitClientComment,
  setVendorApproval,
  uploadInspirationImage,
  deleteInspirationImage,
} from "@/lib/actions/portal";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ clientPortalToken: string }>;
}) {
  const { clientPortalToken } = await params;

  const event = await prisma.event.findUnique({
    where: { clientPortalToken },
    include: {
      organizer: true,
      guests: { orderBy: { name: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      timelineItems: { orderBy: { time: "asc" } },
      eventVendors: { orderBy: { createdAt: "asc" }, include: { vendor: true } },
      clientComments: { orderBy: { createdAt: "desc" } },
      styleGuideImages: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!event) {
    notFound();
  }

  // Lead.convertedEventId no es una relación real de Prisma, solo un string —
  // hay que buscar el lead de origen manualmente para encontrar sus contratos.
  const lead = await prisma.lead.findFirst({
    where: { convertedEventId: event.id },
    include: { contracts: { orderBy: { createdAt: "asc" } } },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce((sum, g) => sum + 1 + (g.companionsConfirmed ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl">
        <BrandHeader organizer={event.organizer} />
        {event.logoImageType && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/events/${event.id}/logo`}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover"
          />
        )}
        <p className="text-center text-xs uppercase tracking-[0.2em] text-gold-dark">
          Portal del cliente
        </p>
        <h1 className="mt-1 text-center font-serif text-2xl font-medium text-ink">
          {event.title}
        </h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          {formatDateTime(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        {event.calendarToken && (
          <p className="mt-2 text-center">
            <a
              href={`${baseUrl}/api/calendar/${event.calendarToken}`}
              className="text-sm text-gold-dark hover:underline"
            >
              Agregar a tu calendario →
            </a>
          </p>
        )}

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <StatCard label="Confirmados" value={confirmed.length} />
          <StatCard label="No asisten" value={declined.length} />
          <StatCard label="Pendientes" value={pending.length} />
          <StatCard label="Total asistentes" value={totalAttendees} />
        </div>

        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">Invitados</h2>
          <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60">
            <table className="w-full text-sm">
              <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
                <tr>
                  <th className="px-4 py-2">Nombre</th>
                  <th className="px-4 py-2">Mesa</th>
                  <th className="px-4 py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {event.guests.map((guest) => (
                  <tr key={guest.id} className="border-t border-gold/15">
                    <td className="px-4 py-2">{guest.name}</td>
                    <td className="px-4 py-2 text-ink-muted">{guest.tableName || "—"}</td>
                    <td className="px-4 py-2">
                      <StatusBadge status={guest.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {event.tasks.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-lg font-medium text-ink">Tareas</h2>
            <ul className="space-y-1">
              {event.tasks.map((task) => (
                <li key={task.id} className="flex items-center gap-2 text-sm">
                  <span
                    className={`flex h-4 w-4 flex-none items-center justify-center rounded border text-[10px] ${
                      task.done
                        ? "border-success/40 bg-success-bg text-success"
                        : "border-gold/30 bg-white/70"
                    }`}
                  >
                    {task.done ? "✓" : ""}
                  </span>
                  <span className={task.done ? "text-ink-muted line-through" : "text-ink"}>
                    {task.title}
                  </span>
                </li>
              ))}
            </ul>
          </section>
        )}

        {event.timelineItems.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-lg font-medium text-ink">Agenda del día</h2>
            <ol className="space-y-1">
              {event.timelineItems.map((item) => (
                <li key={item.id} className="flex items-baseline gap-3 text-sm">
                  <span className="font-medium text-gold-dark">{item.time}</span>
                  <span className="text-ink">{item.title}</span>
                  {item.responsible && (
                    <span className="text-xs text-ink-muted">({item.responsible})</span>
                  )}
                </li>
              ))}
            </ol>
          </section>
        )}

        {event.eventVendors.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-lg font-medium text-ink">Proveedores</h2>
            <div className="space-y-2">
              {event.eventVendors.map((ev) => (
                <div
                  key={ev.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">
                      {ev.vendor.name}
                      {ev.vendor.category && (
                        <span className="ml-2 rounded-full bg-warm px-2 py-0.5 text-xs text-ink-muted">
                          {ev.vendor.category}
                        </span>
                      )}
                    </p>
                  </div>
                  {ev.clientApproved === true ? (
                    <span className="rounded-full bg-success-bg px-2.5 py-1 text-xs font-medium text-success">
                      Aprobado
                    </span>
                  ) : ev.clientApproved === false ? (
                    <span className="rounded-full bg-danger-bg px-2.5 py-1 text-xs font-medium text-danger">
                      Rechazado
                    </span>
                  ) : (
                    <div className="flex flex-none gap-2">
                      <form action={setVendorApproval.bind(null, clientPortalToken, ev.id, true)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-success/30 px-2.5 py-1 text-xs font-medium text-success hover:bg-success-bg"
                        >
                          Aprobar
                        </button>
                      </form>
                      <form action={setVendorApproval.bind(null, clientPortalToken, ev.id, false)}>
                        <button
                          type="submit"
                          className="rounded-lg border border-danger/30 px-2.5 py-1 text-xs font-medium text-danger hover:bg-danger-bg"
                        >
                          Rechazar
                        </button>
                      </form>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">Moodboard de inspiración</h2>
          <form
            action={uploadInspirationImage.bind(null, clientPortalToken)}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-3"
          >
            <input type="file" name="image" accept="image/*" required className="text-sm" />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Subir
            </button>
          </form>

          {event.styleGuideImages.length > 0 && (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
              {event.styleGuideImages.map((image) => (
                <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-sm">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/style-guide-images/${image.id}`}
                    alt=""
                    className="h-32 w-full object-cover"
                  />
                  {image.uploadedBy === "CLIENT" && (
                    <span className="absolute left-1 top-1 rounded-full bg-black/60 px-1.5 py-0.5 text-[10px] text-white">
                      Subida por ustedes
                    </span>
                  )}
                  {image.uploadedBy === "CLIENT" && (
                    <form
                      action={deleteInspirationImage.bind(null, clientPortalToken, image.id)}
                      className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-center opacity-0 transition group-hover:opacity-100"
                    >
                      <button type="submit" className="text-xs text-white hover:underline">
                        Eliminar
                      </button>
                    </form>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {lead && lead.contracts.length > 0 && (
          <section className="mt-8">
            <h2 className="mb-3 font-serif text-lg font-medium text-ink">Contrato</h2>
            <div className="space-y-2">
              {lead.contracts.map((contract) => (
                <div
                  key={contract.id}
                  className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3"
                >
                  <div>
                    <p className="text-sm font-medium text-ink">{contract.title}</p>
                    <p className="text-xs text-ink-muted">
                      {contract.signedAt
                        ? `Firmado el ${formatDateTime(contract.signedAt)}`
                        : "Pendiente de firma"}
                    </p>
                  </div>
                  <a
                    href={`/sign/${contract.token}`}
                    className="text-sm text-gold-dark hover:underline"
                  >
                    Ver / descargar →
                  </a>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">Mensajes</h2>
          <form
            action={submitClientComment.bind(null, clientPortalToken)}
            className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-3"
          >
            <div className="flex-1">
              <textarea
                name="body"
                required
                rows={2}
                placeholder="Escribe un mensaje para el organizador..."
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Enviar
            </button>
          </form>
          {event.clientComments.length > 0 && (
            <ul className="mt-3 space-y-2">
              {event.clientComments.map((comment) => (
                <li key={comment.id} className="rounded-lg border border-gold/15 bg-white/50 p-3 text-sm">
                  <p className="text-ink">{comment.body}</p>
                  <p className="mt-1 text-xs text-ink-muted">{formatDateTime(comment.createdAt)}</p>
                </li>
              ))}
            </ul>
          )}
        </section>

        <BrandFooter />
      </div>
    </div>
  );
}
