import type { Guest } from "@prisma/client";
import { StatusBadge } from "@/components/StatusBadge";

export function ConfirmationsPanel({ guests }: { guests: Guest[] }) {
  const responded = guests
    .filter((g) => g.respondedAt !== null)
    .sort((a, b) => (b.respondedAt as Date).getTime() - (a.respondedAt as Date).getTime());

  if (responded.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-gray-500">
        Aún no hay confirmaciones. Aparecerán aquí cuando los invitados respondan.
      </div>
    );
  }

  return (
    <div className="space-y-3 py-6">
      {responded.map((guest) => (
        <div key={guest.id} className="rounded-lg border border-gray-200 bg-white p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">{guest.name}</p>
              <p className="text-xs text-gray-500">
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
            <p className="mt-2 border-l-2 border-indigo-200 pl-3 text-sm italic text-gray-600">
              {guest.messageFromGuest}
            </p>
          )}
        </div>
      ))}
    </div>
  );
}
