import { getTranslations } from "next-intl/server";
import type { Task } from "@prisma/client";
import { createTask, toggleTask, deleteTask } from "@/lib/actions/tasks";
import { TaskCalendar } from "@/components/event-dashboard/TaskCalendar";

export async function TasksPanel({ eventId, tasks }: { eventId: string; tasks: Task[] }) {
  const t = await getTranslations("tasks");
  const done = tasks.filter((t) => t.done).length;
  const withDate = tasks.filter((t) => t.dueDate);
  const withoutDate = tasks.filter((t) => !t.dueDate);

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addTitle")}</h2>
        <form
          action={createTask.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("titleLabel")}</label>
            <input
              name="title"
              required
              placeholder={t("titlePlaceholder")}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("dueDate")}</label>
            <input
              name="dueDate"
              type="date"
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("add")}
          </button>
        </form>
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("calendarTitle", { done, total: tasks.length })}
        </h2>
        <TaskCalendar eventId={eventId} tasks={withDate} />
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("noDateTitle")}</h2>
        {withoutDate.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noDateEmpty")}</p>
        ) : (
          <ul className="space-y-2">
            {withoutDate.map((task) => (
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
                    {t("delete")}
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
