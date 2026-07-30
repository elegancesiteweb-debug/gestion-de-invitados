import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RsvpForm } from "@/components/RsvpForm";
import { EmbedTransparentBackground } from "@/components/EmbedTransparentBackground";

export default async function ConfirmAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { token } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1";

  const guest = await prisma.guest.findUnique({
    where: { token },
    include: { event: true },
  });

  if (!guest) {
    notFound();
  }

  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-1 flex-col justify-center ${
        isEmbed ? "px-2 py-4" : "px-4 py-16"
      }`}
    >
      {isEmbed && <EmbedTransparentBackground />}
      <div className="rounded-2xl border border-gold/20 bg-warm/90 p-7 shadow-lg backdrop-blur-xl">
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
          currentDietaryNotes={guest.dietaryNotes}
          askDietary={guest.event.askDietaryOnRsvp}
          askMessage={guest.event.askMessageOnRsvp}
        />
      </div>
    </div>
  );
}
