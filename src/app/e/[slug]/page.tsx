import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";

export default async function PublicEventPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  const event = await prisma.event.findUnique({ where: { slug } });

  if (!event) {
    notFound();
  }

  const mapUrl =
    event.mapUrl ||
    (event.location
      ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(event.location)}`
      : null);

  return (
    <div className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-4 py-16">
      <div className="rounded-2xl border border-gold/20 bg-warm/90 p-7 shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">Invitación</p>
        <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {event.eventDate.toLocaleString("es-ES", { dateStyle: "long", timeStyle: "short" })}
        </p>

        {event.location && (
          <p className="mt-1 text-sm text-ink-muted">
            {event.location}
            {mapUrl && (
              <>
                {" "}
                ·{" "}
                <a
                  href={mapUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-gold-dark hover:underline"
                >
                  Ver en mapa
                </a>
              </>
            )}
          </p>
        )}

        {event.dressCode && (
          <p className="mt-1 text-sm text-ink-muted">
            <span className="font-medium">Código de vestimenta:</span> {event.dressCode}
          </p>
        )}

        {event.notes && <p className="mt-3 text-sm text-ink-muted">{event.notes}</p>}

        <div className="mt-5 border-t border-gold/15 pt-4">
          {event.publicRsvpToken ? (
            <Link
              href={`/g/${event.publicRsvpToken}`}
              className="block w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2.5 text-center text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40"
            >
              Confirmar asistencia →
            </Link>
          ) : (
            <p className="text-sm text-ink-muted">
              Contacta al organizador para tu invitación personalizada de confirmación.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
