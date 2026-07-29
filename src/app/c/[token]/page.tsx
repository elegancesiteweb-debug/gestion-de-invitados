import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RsvpForm } from "@/components/RsvpForm";

export default async function ConfirmAttendancePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { event: true },
  });

  if (!guest) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-gold/20 bg-white/70 p-7 shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
          Confirmación de asistencia
        </p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{guest.event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {guest.event.eventDate.toLocaleString("es-ES", {
            dateStyle: "long",
            timeStyle: "short",
          })}
        </p>
        {guest.event.location && <p className="text-sm text-ink-muted">{guest.event.location}</p>}
        {guest.event.notes && <p className="mt-2 text-sm text-ink-muted">{guest.event.notes}</p>}

        <div className="mt-4 border-t border-gold/15 pt-4">
          <p className="text-sm text-ink-muted">
            Hola <span className="font-medium text-ink">{guest.name}</span>, por favor confirma tu
            asistencia.
          </p>
          {guest.event.showTableOnRsvp && guest.tableName && (
            <p className="mt-1 text-sm text-ink-muted">Mesa asignada: {guest.tableName}</p>
          )}
        </div>

        <RsvpForm
          token={token}
          maxCompanions={guest.maxCompanions}
          currentStatus={guest.status}
          currentCompanions={guest.companionsConfirmed}
          currentMessage={guest.messageFromGuest}
        />
      </div>
    </div>
  );
}
