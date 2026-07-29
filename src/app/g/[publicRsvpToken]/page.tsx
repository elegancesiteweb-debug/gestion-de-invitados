import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GeneralRsvpForm } from "@/components/GeneralRsvpForm";

export default async function GeneralConfirmAttendancePage({
  params,
}: {
  params: Promise<{ publicRsvpToken: string }>;
}) {
  const { publicRsvpToken } = await params;

  const event = await prisma.event.findUnique({ where: { publicRsvpToken } });

  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-gold/20 bg-white/70 p-7 shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
          Confirmación de asistencia
        </p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {event.eventDate.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
        </p>
        {event.location && <p className="text-sm text-ink-muted">{event.location}</p>}
        {event.notes && <p className="mt-2 text-sm text-ink-muted">{event.notes}</p>}

        <div className="mt-4 border-t border-gold/15 pt-4">
          <p className="text-sm text-ink-muted">Por favor confirma tu asistencia.</p>
        </div>

        <GeneralRsvpForm
          publicRsvpToken={publicRsvpToken}
          maxCompanions={event.generalMaxCompanions}
        />
      </div>
    </div>
  );
}
