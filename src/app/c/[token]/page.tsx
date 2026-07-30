import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { RsvpForm } from "@/components/RsvpForm";
import { EmbedTransparentBackground } from "@/components/EmbedTransparentBackground";
import { formatDateTime } from "@/lib/dates";

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
    include: { event: true, companions: true },
  });

  if (!guest) {
    notFound();
  }

  const invitationUrl = guest.invitationLinkUrl ?? guest.event.invitationLinkUrl;
  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

  return (
    <div
      className={`mx-auto flex w-full max-w-md flex-1 flex-col justify-center ${
        isEmbed ? "px-2 py-4" : "px-4 py-16"
      }`}
    >
      {isEmbed && <EmbedTransparentBackground />}
      <div className="rounded-2xl border border-gold/20 bg-warm/90 p-7 shadow-lg backdrop-blur-xl">
        {guest.event.logoImageType && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/events/${guest.event.id}/logo`}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover"
          />
        )}
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
          Confirmación de asistencia
        </p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{guest.event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {formatDateTime(guest.event.eventDate)}
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
          {invitationUrl && (
            <a
              href={invitationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-gold-dark hover:underline"
            >
              Ver invitación →
            </a>
          )}
        </div>

        <RsvpForm
          token={token}
          maxCompanions={guest.maxCompanions}
          currentStatus={guest.status}
          currentCompanions={guest.companionsConfirmed}
          currentCompanionNames={guest.companions}
          currentMessage={guest.messageFromGuest}
          currentDietaryNotes={guest.dietaryNotes}
          askDietary={guest.event.askDietaryOnRsvp}
          askMessage={guest.event.askMessageOnRsvp}
          askCompanionNames={guest.event.askCompanionNamesOnRsvp}
          checkinUrl={`${baseUrl}/checkin/${guest.checkinToken}`}
          showQr={guest.event.showQrOnConfirmation}
        />
      </div>
    </div>
  );
}
