import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { StatCard } from "@/components/event-dashboard/StatCard";
import { StatusBadge } from "@/components/StatusBadge";
import { formatDateTime } from "@/lib/dates";

export default async function ClientPortalPage({
  params,
}: {
  params: Promise<{ clientPortalToken: string }>;
}) {
  const { clientPortalToken } = await params;

  const event = await prisma.event.findUnique({
    where: { clientPortalToken },
    include: {
      guests: { orderBy: { name: "asc" } },
      tasks: { orderBy: { createdAt: "asc" } },
      timelineItems: { orderBy: { time: "asc" } },
    },
  });

  if (!event) {
    notFound();
  }

  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce((sum, g) => sum + 1 + (g.companionsConfirmed ?? 0), 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl">
        {event.logoImageType && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/events/${event.id}/logo`}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover"
          />
        )}
        <p className="text-center text-xs uppercase tracking-[0.2em] text-gold-dark">
          Portal del cliente · solo lectura
        </p>
        <h1 className="mt-1 text-center font-serif text-2xl font-medium text-ink">
          {event.title}
        </h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          {formatDateTime(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>

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
      </div>
    </div>
  );
}
