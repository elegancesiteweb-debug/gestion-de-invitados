import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SignOutButton } from "@/components/SignOutButton";

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
    },
  });

  const canCreateEvent =
    organizer.accountType === "PLANNER" || organizer.eventsCreatedCount < 1;

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Panel de organizador</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-ink">Tus eventos</h1>
          <p className="text-sm text-ink-muted">Hola, {session.user.name}</p>
        </div>
        <div className="flex items-center gap-4">
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
            return (
              <li key={event.id}>
                <Link
                  href={`/dashboard/events/${event.id}`}
                  className="block rounded-xl border border-gold/20 bg-white p-4 shadow-sm transition hover:border-gold/40 hover:shadow-md"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-ink">{event.title}</p>
                      <p className="text-sm text-ink-muted">
                        {event.eventDate.toLocaleDateString("es-ES", { dateStyle: "long" })}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-ink-muted">
                      {confirmed}/{total} confirmados
                    </p>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
