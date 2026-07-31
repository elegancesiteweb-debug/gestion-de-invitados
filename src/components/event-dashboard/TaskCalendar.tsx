"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { Task } from "@prisma/client";
import { useLocale, useTranslations } from "next-intl";
import { toggleTask, deleteTask } from "@/lib/actions/tasks";
import { APP_TIMEZONE } from "@/lib/dates";

function dateKey(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE });
}

function isOverdue(task: Task, todayKey: string): boolean {
  return !task.done && !!task.dueDate && dateKey(new Date(task.dueDate)) < todayKey;
}

export function TaskCalendar({ eventId, tasks }: { eventId: string; tasks: Task[] }) {
  const t = useTranslations("taskCalendar");
  const locale = useLocale();
  const monthNames = t.raw("monthNames") as string[];
  const weekdayLabels = t.raw("weekdayLabels") as string[];
  const dateLocale = locale === "en" ? "en-US" : "es-ES";

  const today = new Date();
  const [monthCursor, setMonthCursor] = useState(
    () => new Date(today.getFullYear(), today.getMonth(), 1)
  );
  const [selected, setSelected] = useState<Task | null>(null);
  const [prevTasks, setPrevTasks] = useState(tasks);

  if (tasks !== prevTasks) {
    setPrevTasks(tasks);
    if (selected) {
      setSelected(tasks.find((t) => t.id === selected.id) ?? null);
    }
  }

  const tasksByDay = new Map<string, Task[]>();
  for (const task of tasks) {
    if (!task.dueDate) continue;
    const key = dateKey(new Date(task.dueDate));
    const list = tasksByDay.get(key) ?? [];
    list.push(task);
    tasksByDay.set(key, list);
  }

  const year = monthCursor.getFullYear();
  const month = monthCursor.getMonth();
  const firstDay = new Date(year, month, 1);
  const startOffset = firstDay.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const todayKey = dateKey(today);

  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setMonthCursor(new Date(year, month - 1, 1))}
          className="rounded-lg border border-gold/25 px-2 py-1 text-sm hover:bg-warm"
        >
          ←
        </button>
        <p className="font-serif text-lg font-medium capitalize text-ink">
          {monthNames[month]} {year}
        </p>
        <button
          type="button"
          onClick={() => setMonthCursor(new Date(year, month + 1, 1))}
          className="rounded-lg border border-gold/25 px-2 py-1 text-sm hover:bg-warm"
        >
          →
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-ink-muted">
        {weekdayLabels.map((w, i) => (
          <div key={i}>{w}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={i} />;
          const key = dateKey(date);
          const dayTasks = tasksByDay.get(key) ?? [];
          const isToday = key === todayKey;
          return (
            <div
              key={i}
              className={`min-h-16 rounded-lg border p-1 text-left ${
                isToday ? "border-gold bg-warm" : "border-gold/15 bg-white/50"
              }`}
            >
              <p className="text-[11px] text-ink-muted">{date.getDate()}</p>
              <div className="mt-0.5 space-y-0.5">
                {dayTasks.map((task) => (
                  <button
                    key={task.id}
                    type="button"
                    onClick={() => setSelected(task)}
                    className={`block w-full truncate rounded px-1 py-0.5 text-left text-[11px] ${
                      task.done
                        ? "bg-success-bg text-success line-through"
                        : isOverdue(task, todayKey)
                          ? "bg-danger-bg text-danger"
                          : "bg-gold/15 text-ink"
                    }`}
                  >
                    {task.title}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {selected &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setSelected(null)}
          >
            <div
              className="w-full max-w-sm rounded-2xl border border-gold/20 bg-white p-6"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="font-serif text-xl font-medium text-ink">{selected.title}</p>
              <p className="mt-1 text-sm text-ink-muted">
                {selected.dueDate
                  ? new Date(selected.dueDate).toLocaleDateString(dateLocale, {
                      timeZone: APP_TIMEZONE,
                      dateStyle: "long",
                    })
                  : t("noDate")}
              </p>
              <p className="mt-3 text-sm">
                {t("status")}:{" "}
                <span
                  className={
                    selected.done
                      ? "text-success"
                      : isOverdue(selected, todayKey)
                        ? "text-danger"
                        : "text-warning"
                  }
                >
                  {selected.done ? t("completed") : isOverdue(selected, todayKey) ? t("overdue") : t("pending")}
                </span>
              </p>
              <div className="mt-5 flex gap-2">
                <form action={toggleTask.bind(null, eventId, selected.id)} className="flex-1">
                  <button
                    type="submit"
                    className="w-full rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
                  >
                    {selected.done ? t("markPending") : t("markDone")}
                  </button>
                </form>
                <form action={deleteTask.bind(null, eventId, selected.id)}>
                  <button type="submit" className="rounded-lg px-3 py-1.5 text-sm text-danger hover:underline">
                    {t("delete")}
                  </button>
                </form>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="mt-3 w-full rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
              >
                {t("close")}
              </button>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
