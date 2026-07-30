import type { Companion, Guest } from "@prisma/client";
import { CheckedInGuestList } from "@/components/event-dashboard/CheckedInGuestList";

export function AccessPanel({ guests }: { guests: (Guest & { companions: Companion[] })[] }) {
  const arrived = guests
    .filter((g) => g.checkedInAt !== null)
    .sort((a, b) => (b.checkedInAt as Date).getTime() - (a.checkedInAt as Date).getTime());
  const notArrived = guests.filter((g) => g.checkedInAt === null);
  const totalPasses = arrived.reduce((sum, g) => sum + (g.checkedInPasses ?? 1), 0);

  return (
    <div className="space-y-6 py-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
          <p className="font-serif text-3xl font-medium text-success">{arrived.length}</p>
          <p className="text-xs text-ink-muted">Registrados</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
          <p className="font-serif text-3xl font-medium text-gold-dark">{totalPasses}</p>
          <p className="text-xs text-ink-muted">Pases usados</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white/60 p-4 text-center shadow-md backdrop-blur-xl">
          <p className="font-serif text-3xl font-medium text-warning">{notArrived.length}</p>
          <p className="text-xs text-ink-muted">Sin ingresar</p>
        </div>
      </div>

      <div>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Registros de entrada</h2>
        {arrived.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Sin accesos registrados aún. Aparecerán aquí al escanear el QR de acceso de cada
            invitado.
          </p>
        ) : (
          <CheckedInGuestList guests={arrived} />
        )}
      </div>
    </div>
  );
}
