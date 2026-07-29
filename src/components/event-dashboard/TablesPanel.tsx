import type { Guest } from "@prisma/client";

export function TablesPanel({ guests }: { guests: Guest[] }) {
  const groups = new Map<string, { label: string; guests: Guest[] }>();

  for (const guest of guests) {
    const raw = guest.tableName?.trim() || "";
    const key = raw.toLowerCase();
    const label = raw || "Sin mesa";
    if (!groups.has(key)) {
      groups.set(key, { label, guests: [] });
    }
    groups.get(key)!.guests.push(guest);
  }

  const tables = [...groups.values()].sort((a, b) => a.label.localeCompare(b.label));

  if (tables.length === 0) {
    return (
      <div className="py-10 text-center text-sm text-ink-muted">
        Aún no hay invitados con mesa asignada.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-3 py-6 sm:grid-cols-2 md:grid-cols-3">
      {tables.map((table) => {
        const confirmed = table.guests.filter((g) => g.status === "CONFIRMED").length;
        const pending = table.guests.filter((g) => g.status === "PENDING").length;
        return (
          <div key={table.label} className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
            <p className="font-medium">{table.label}</p>
            <p className="mt-1 text-xs text-ink-muted">
              {table.guests.length} invitado{table.guests.length !== 1 ? "s" : ""}
            </p>
            <div className="mt-2 flex gap-3 text-xs">
              <span className="text-success">{confirmed} confirmado(s)</span>
              {pending > 0 && <span className="text-warning">{pending} pendiente(s)</span>}
            </div>
            <ul className="mt-3 space-y-1 text-sm text-ink-muted">
              {table.guests.map((g) => (
                <li key={g.id}>{g.name}</li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
}
