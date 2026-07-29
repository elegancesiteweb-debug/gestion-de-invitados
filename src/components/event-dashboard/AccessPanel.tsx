import type { Guest } from "@prisma/client";

export function AccessPanel({ guests }: { guests: Guest[] }) {
  const arrived = guests
    .filter((g) => g.checkedInAt !== null)
    .sort((a, b) => (b.checkedInAt as Date).getTime() - (a.checkedInAt as Date).getTime());
  const notArrived = guests.filter((g) => g.checkedInAt === null);
  const totalPasses = arrived.reduce((sum, g) => sum + (g.checkedInPasses ?? 1), 0);

  return (
    <div className="space-y-6 py-6">
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-gold/20 bg-white p-4 text-center">
          <p className="font-serif text-3xl font-medium text-success">{arrived.length}</p>
          <p className="text-xs text-ink-muted">Registrados</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white p-4 text-center">
          <p className="font-serif text-3xl font-medium text-gold-dark">{totalPasses}</p>
          <p className="text-xs text-ink-muted">Pases usados</p>
        </div>
        <div className="rounded-lg border border-gold/20 bg-white p-4 text-center">
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
          <div className="space-y-2">
            {arrived.map((guest) => (
              <div
                key={guest.id}
                className="flex items-center justify-between rounded-lg border border-gold/20 bg-white p-3"
              >
                <div>
                  <p className="font-medium">{guest.name}</p>
                  <p className="text-xs text-ink-muted">
                    {guest.tableName || "Sin mesa"} · {guest.checkedInPasses ?? 1} pase
                    {(guest.checkedInPasses ?? 1) !== 1 ? "s" : ""}
                  </p>
                </div>
                <p className="text-sm font-medium text-success">
                  {(guest.checkedInAt as Date).toLocaleTimeString("es-ES", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
