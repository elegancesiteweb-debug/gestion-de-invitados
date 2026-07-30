import type { TimelineItem } from "@prisma/client";
import { createTimelineItem, deleteTimelineItem } from "@/lib/actions/timeline";

export function TimelinePanel({
  eventId,
  items,
}: {
  eventId: string;
  items: TimelineItem[];
}) {
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Agregar momento</h2>
        <form
          action={createTimelineItem.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">Hora</label>
            <input
              name="time"
              type="time"
              required
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Actividad</label>
            <input
              name="title"
              required
              placeholder="Ej. Ceremonia"
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Responsable (opcional)</label>
            <input
              name="responsible"
              placeholder="Ej. Wedding planner"
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            Agregar
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          Agenda del día ({sorted.length})
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay momentos en la agenda.</p>
        ) : (
          <ol className="space-y-2">
            {sorted.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 shadow-sm backdrop-blur-xl"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-base font-medium text-gold-dark">
                    {item.time}
                  </span>
                  <div>
                    <p className="text-sm text-ink">{item.title}</p>
                    {item.responsible && (
                      <p className="text-xs text-ink-muted">A cargo de: {item.responsible}</p>
                    )}
                  </div>
                </div>
                <form action={deleteTimelineItem.bind(null, eventId, item.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
