import type { Event, Task, TimelineItem } from "@prisma/client";
import { APP_TIMEZONE } from "@/lib/dates";

function escapeText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function dateOnlyInAppTimezone(date: Date): string {
  return date.toLocaleDateString("en-CA", { timeZone: APP_TIMEZONE }).replace(/-/g, "");
}

function utcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
}

function buildEvent(
  uid: string,
  summary: string,
  opts: { allDay?: string; floatingDateTime?: string; description?: string }
): string[] {
  const lines = ["BEGIN:VEVENT", `UID:${uid}`, `DTSTAMP:${utcStamp(new Date())}`];
  if (opts.allDay) {
    lines.push(`DTSTART;VALUE=DATE:${opts.allDay}`);
  } else if (opts.floatingDateTime) {
    lines.push(`DTSTART:${opts.floatingDateTime}`);
  }
  lines.push(`SUMMARY:${escapeText(summary)}`);
  if (opts.description) {
    lines.push(`DESCRIPTION:${escapeText(opts.description)}`);
  }
  lines.push("END:VEVENT");
  return lines;
}

function buildEventVEvents(
  event: Pick<Event, "id" | "title" | "eventDate">,
  tasks: Pick<Task, "id" | "title" | "dueDate" | "done">[],
  timelineItems: Pick<TimelineItem, "id" | "title" | "time" | "responsible">[],
  titlePrefix = ""
): string[] {
  const lines: string[] = [];

  lines.push(
    ...buildEvent(`event-${event.id}@eleganciasite`, `${titlePrefix}${event.title}`, {
      allDay: dateOnlyInAppTimezone(event.eventDate),
    })
  );

  for (const task of tasks) {
    if (!task.dueDate || task.done) continue;
    lines.push(
      ...buildEvent(
        `task-${task.id}@eleganciasite`,
        `${titlePrefix}Fecha límite: ${task.title}`,
        { allDay: dateOnlyInAppTimezone(task.dueDate) }
      )
    );
  }

  const eventDay = dateOnlyInAppTimezone(event.eventDate);
  for (const item of timelineItems) {
    const timeMatch = /^(\d{1,2}):(\d{2})$/.exec(item.time.trim());
    const hhmmss = timeMatch
      ? `${timeMatch[1].padStart(2, "0")}${timeMatch[2]}00`
      : "000000";
    lines.push(
      ...buildEvent(`timeline-${item.id}@eleganciasite`, `${titlePrefix}${item.title}`, {
        floatingDateTime: `${eventDay}T${hhmmss}`,
        description: item.responsible ? `Responsable: ${item.responsible}` : undefined,
      })
    );
  }

  return lines;
}

export function buildEventCalendar(
  event: Pick<Event, "id" | "title" | "eventDate">,
  tasks: Pick<Task, "id" | "title" | "dueDate" | "done">[],
  timelineItems: Pick<TimelineItem, "id" | "title" | "time" | "responsible">[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elegance Site//Gestion Invitados//ES",
    "CALSCALE:GREGORIAN",
    ...buildEventVEvents(event, tasks, timelineItems),
    "END:VCALENDAR",
  ];
  return lines.join("\r\n");
}

export function buildOrganizerCalendar(
  events: (Pick<Event, "id" | "title" | "eventDate"> & {
    tasks: Pick<Task, "id" | "title" | "dueDate" | "done">[];
    timelineItems: Pick<TimelineItem, "id" | "title" | "time" | "responsible">[];
  })[]
): string {
  const lines: string[] = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Elegance Site//Gestion Invitados//ES",
    "CALSCALE:GREGORIAN",
  ];

  for (const event of events) {
    lines.push(...buildEventVEvents(event, event.tasks, event.timelineItems, `${event.title} · `));
  }

  lines.push("END:VCALENDAR");
  return lines.join("\r\n");
}
