import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/SignOutButton";
import { formatDate } from "@/lib/dates";
import { hasFeature } from "@/lib/features";

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const organizer = await prisma.organizer.findUniqueOrThrow({ where: { id: session.user.id } });

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { eventDate: "asc" },
    include: {
      _count: { select: { guests: true } },
      guests: { select: { status: true, companionsConfirmed: true } },
      tasks: { select: { done: true } },
      budgetItems: { select: { estimatedAmount: true, actualAmount: true } },
    },
  });

  const canCreateEvent =
    organizer.accountType === "PLANNER" || organizer.eventsCreatedCount < 1;
  const showVendorsLink = hasFeature(session.user.accountType, "vendor_directory");
  const showLeadsLink = hasFeature(session.user.accountType, "crm_leads");
  const showIntegrationsLink = hasFeature(session.user.accountType, "own_integrations");
  const showMultiEventStats = hasFeature(session.user.accountType, "multi_event_dashboard");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-gold/20 bg-white/60 p-5 shadow-lg backdrop-blur-xl">
        <div className="flex items-center gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="Elegance Site" className="h-12 w-12 flex-none" />
          <div>
            <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
              Elegance Site · Panel de organizador
            </p>
            <h1 className="mt-1 font-serif text-2xl font-medium text-ink">Tus eventos</h1>
            <p className="text-sm text-ink-muted">Hola, {session.user.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          {showVendorsLink && (
            <Link href="/dashboard/vendors" className="text-sm text-gold-dark hover:underline">
              Proveedores
            </Link>
          )}
          {showLeadsLink && (
            <Link href="/dashboard/leads" className="text-sm text-gold-dark hover:underline">
              Leads
            </Link>
          )}
          {showIntegrationsLink && (
            <Link href="/dashboard/settings" className="text-sm text-gold-dark hover:underline">
              Integraciones
            </Link>
          )}
          {session.user.isAdmin && (
            <Link href="/dashboard/admin" className="text-sm text-gold-dark hover:underline">
              Admin
            </Link>
          )}
          {canCreateEvent ? (
            <Link
              href="/dashboard/events/new"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40"
            >
              + Nuevo evento
            </Link>
          ) : (
            <p className="text-xs text-ink-muted">
              Tu plan permite un solo evento.
              <br />
              Contáctanos para pasar a Wedding Planner.
            </p>
          )}
          <SignOutButton />
        </div>
      </header>

      {events.length === 0 ? (
        <p className="text-ink-muted">
          Aún no tienes eventos. Crea el primero para empezar a gestionar invitados.
        </p>
      ) : (
        <ul className="space-y-3">
          {events.map((event) => {
            const confirmed = event.guests.filter((g) => g.status === "CONFIRMED").length;
            const total = event._count.guests;

            const pendingTasks = event.tasks.filter((t) => !t.done).length;
            const totalEstimated = event.budgetItems.reduce((sum, b) => sum + b.estimatedAmount, 0);
            const totalActual = event.budgetItems.reduce((sum, b) => sum + (b.actualAmount ?? 0), 0);
            const daysUntil = Math.ceil(
              (event.eventDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
            );

            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="block rounded-xl border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl transition hover:border-gold/40 hover:shadow-lg"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex min-w-0 items-center gap-3">
                      {event.logoImageType && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={`/api/events/${event.id}/logo`}
                          alt=""
                          className="h-12 w-12 flex-none rounded-lg object-cover"
                        />
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-medium text-ink">{event.title}</p>
                        <p className="text-sm text-ink-muted">
                          {formatDate(event.eventDate)}
                          {event.location ? ` · ${event.location}` : ""}
                        </p>
                      </div>
                    </div>
                    <p className="flex-none text-sm text-ink-muted">
                      {confirmed}/{total} confirmados
                    </p>
                  </div>

                  {showMultiEventStats && (
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 border-t border-gold/15 pt-2 text-xs text-ink-muted">
                      <span>{daysUntil >= 0 ? `${daysUntil} día(s) para el evento` : "Ya pasó"}</span>
                      <span>{pendingTasks} tarea(s) pendiente(s)</span>
                      <span>
                        Presupuesto: {totalActual.toLocaleString("es-ES")} /{" "}
                        {totalEstimated.toLocaleString("es-ES")}
                      </span>
                    </div>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
