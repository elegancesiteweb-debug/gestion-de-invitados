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

  const events = await prisma.event.findMany({
    where: { organizerId: session.user.id },
    orderBy: { eventDate: "asc" },
    include: {
      _count: { select: { guests: true } },
      guests: { select: { status: true, companionsConfirmed: true } },
    },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Tus eventos</h1>
          <p className="text-sm text-gray-500">Hola, {session.user.name}</p>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/dashboard/events/new"
            className="rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
          >
            + Nuevo evento
          </Link>
          <SignOutButton />
        </div>
      </header>

      {events.length === 0 ? (
        <p className="text-gray-500">
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
                  className="block rounded-lg border border-gray-200 bg-white p-4 hover:border-indigo-300"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{event.title}</p>
                      <p className="text-sm text-gray-500">
                        {event.eventDate.toLocaleDateString("es-ES", { dateStyle: "long" })}
                        {event.location ? ` · ${event.location}` : ""}
                      </p>
                    </div>
                    <p className="text-sm text-gray-500">
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
