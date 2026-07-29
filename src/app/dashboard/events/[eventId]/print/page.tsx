import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";

export default async function PrintConfirmationsPage({
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
    include: { guests: { orderBy: { name: "asc" } } },
  });

  if (!event) {
    notFound();
  }

  const confirmed = event.guests.filter((g) => g.status === "CONFIRMED");
  const declined = event.guests.filter((g) => g.status === "DECLINED");
  const pending = event.guests.filter((g) => g.status === "PENDING");
  const totalAttendees = confirmed.reduce(
    (sum, g) => sum + 1 + (g.companionsConfirmed ?? 0),
    0
  );

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/events/${eventId}`}
          className="text-sm text-gold-dark hover:underline"
        >
          ← Volver al evento
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          Lista de confirmaciones ·{" "}
          {event.eventDate.toLocaleDateString("es-ES", { dateStyle: "long" })}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="font-serif text-2xl font-medium text-success">{confirmed.length}</p>
          <p className="text-xs text-ink-muted">Confirmados</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-danger">{declined.length}</p>
          <p className="text-xs text-ink-muted">No asisten</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-warning">{pending.length}</p>
          <p className="text-xs text-ink-muted">Pendientes</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-ink">{totalAttendees}</p>
          <p className="text-xs text-ink-muted">Total asistentes</p>
        </div>
      </div>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink/20 text-left text-xs uppercase text-ink-muted">
            <th className="py-2 pr-2">Nombre</th>
            <th className="py-2 pr-2">Mesa</th>
            <th className="py-2 pr-2">Estado</th>
            <th className="py-2 pr-2">Personas</th>
            <th className="py-2 pr-2">Restricción alimentaria</th>
            <th className="py-2">Mensaje</th>
          </tr>
        </thead>
        <tbody>
          {event.guests.map((guest) => (
            <tr key={guest.id} className="border-b border-ink/10">
              <td className="py-2 pr-2">{guest.name}</td>
              <td className="py-2 pr-2">{guest.tableName || "—"}</td>
              <td className="py-2 pr-2">
                {guest.status === "CONFIRMED"
                  ? "Confirmado"
                  : guest.status === "DECLINED"
                    ? "No asiste"
                    : "Pendiente"}
              </td>
              <td className="py-2 pr-2">
                {guest.status === "CONFIRMED" ? 1 + (guest.companionsConfirmed ?? 0) : "—"}
              </td>
              <td className="py-2 pr-2 text-ink-muted">{guest.dietaryNotes || ""}</td>
              <td className="py-2 text-ink-muted">{guest.messageFromGuest || ""}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-6 text-center text-xs text-ink-light">
        Generado el {new Date().toLocaleDateString("es-ES", { dateStyle: "long" })}
      </p>
    </div>
  );
}
