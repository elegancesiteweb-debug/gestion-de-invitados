import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { GeneralRsvpForm } from "@/components/GeneralRsvpForm";
import { EmbedTransparentBackground } from "@/components/EmbedTransparentBackground";
import { formatDateTime } from "@/lib/dates";

export default async function GeneralConfirmAttendancePage({
  params,
  searchParams,
}: {
  params: Promise<{ publicRsvpToken: string }>;
  searchParams: Promise<{ embed?: string }>;
}) {
  const { publicRsvpToken } = await params;
  const { embed } = await searchParams;
  const isEmbed = embed === "1";

  const event = await prisma.event.findUnique({ where: { publicRsvpToken } });

  if (!event) {
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
        {event.logoImageType && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={`/api/events/${event.id}/logo`}
            alt=""
            className="mx-auto mb-3 h-20 w-20 rounded-full object-cover"
          />
        )}
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">
          Confirmación de asistencia
        </p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {formatDateTime(event.eventDate)}
        </p>
        {event.location && <p className="text-sm text-ink-muted">{event.location}</p>}
        {event.notes && <p className="mt-2 text-sm text-ink-muted">{event.notes}</p>}

        <div className="mt-4 border-t border-gold/15 pt-4">
          <p className="text-sm text-ink-muted">Por favor confirma tu asistencia.</p>
          {event.invitationLinkUrl && (
            <a
              href={event.invitationLinkUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 inline-block text-sm font-medium text-gold-dark hover:underline"
            >
              Ver invitación →
            </a>
          )}
        </div>

        <GeneralRsvpForm
          publicRsvpToken={publicRsvpToken}
          maxCompanions={event.generalMaxCompanions}
          askDietary={event.askDietaryOnRsvp}
          askMessage={event.askMessageOnRsvp}
          askCompanionNames={event.askCompanionNamesOnRsvp}
          showQr={event.showQrOnConfirmation}
        />
      </div>
    </div>
  );
}
