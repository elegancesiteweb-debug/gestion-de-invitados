import type { Task } from "@prisma/client";
import { createTask, toggleTask, deleteTask } from "@/lib/actions/tasks";

export function TasksPanel({ eventId, tasks }: { eventId: string; tasks: Task[] }) {
  const done = tasks.filter((t) => t.done).length;

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Agregar tarea</h2>
        <form
          action={createTask.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">Título</label>
            <input
              name="title"
              required
              placeholder="Ej. Reservar catering"
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
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
          Tareas ({done}/{tasks.length} completadas)
        </h2>
        {tasks.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay tareas para este evento.</p>
        ) : (
          <ul className="space-y-2">
            {tasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 shadow-sm backdrop-blur-xl"
              >
                <form action={toggleTask.bind(null, eventId, task.id)} className="flex-1">
                  <button
                    type="submit"
                    className={`flex w-full items-center gap-2 text-left text-sm ${
                      task.done ? "text-ink-muted line-through" : "text-ink"
                    }`}
                  >
                    <span
                      className={`flex h-5 w-5 flex-none items-center justify-center rounded border ${
                        task.done
                          ? "border-success/40 bg-success-bg text-success"
                          : "border-gold/30 bg-white/70"
                      }`}
                    >
                      {task.done ? "✓" : ""}
                    </span>
                    {task.title}
                  </button>
                </form>
                <form action={deleteTask.bind(null, eventId, task.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    Eliminar
                  </button>
                </form>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
