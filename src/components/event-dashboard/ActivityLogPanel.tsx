import type { ActivityLogEntry } from "@prisma/client";
import { formatDateTime } from "@/lib/dates";

export function ActivityLogPanel({ entries }: { entries: ActivityLogEntry[] }) {
  return (
    <div className="space-y-3 py-6">
      <h2 className="font-serif text-lg font-medium text-ink">Actividad</h2>
      <p className="text-xs text-ink-muted">
        Registro de las acciones más importantes de este evento — quién y cuándo.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm text-ink-muted">Todavía no hay actividad registrada.</p>
      ) : (
        <ul className="space-y-2">
          {entries.map((entry) => (
            <li
              key={entry.id}
              className="rounded-lg border border-gold/20 bg-white/60 p-3 text-sm shadow-sm backdrop-blur-xl"
            >
              <p className="text-ink">
                <span className="font-medium">{entry.actorName}</span> — {entry.action}
              </p>
              <p className="mt-1 text-xs text-ink-muted">{formatDateTime(entry.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
