import Link from "next/link";
import type { Guest } from "@prisma/client";
import { StatusBadge } from "@/components/StatusBadge";

export function ConfirmationsPanel({ eventId, guests }: { eventId: string; guests: Guest[] }) {
  const responded = guests
    .filter((g) => g.respondedAt !== null)
    .sort((a, b) => (b.respondedAt as Date).getTime() - (a.respondedAt as Date).getTime());

  if (responded.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-ink-muted">
        Aún no hay confirmaciones. Aparecerán aquí cuando los invitados respondan.
      </div>
    );
  }

  return (
    <div className="space-y-3 py-6">
      <div className="flex justify-end">
        <Link
          href={`/dashboard/events/${eventId}/print`}
          className="text-sm text-gold-dark hover:underline"
        >
          Exportar / imprimir lista
        </Link>
      </div>

      {responded.map((guest) => (
        <div key={guest.id} className="rounded-lg border border-gold/20 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{guest.name}</p>
              <p className="text-xs text-ink-muted">
                {guest.status === "CONFIRMED"
                  ? `Asistirá · ${1 + (guest.companionsConfirmed ?? 0)} persona(s)`
                  : "No podrá asistir"}
                {guest.respondedAt &&
                  ` · ${guest.respondedAt.toLocaleDateString("es-ES", {
                    day: "2-digit",
                    month: "short",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}`}
              </p>
            </div>
            <StatusBadge status={guest.status} />
          </div>
          {guest.messageFromGuest && (
            <p className="mt-2 border-l-2 border-gold/30 pl-3 text-sm italic text-ink-muted">
              {guest.messageFromGuest}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
