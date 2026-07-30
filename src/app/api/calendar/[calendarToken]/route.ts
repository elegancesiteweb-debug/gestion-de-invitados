import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildEventCalendar } from "@/lib/ics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ calendarToken: string }> }
) {
  const { calendarToken } = await params;

  const event = await prisma.event.findUnique({
    where: { calendarToken },
    include: {
      tasks: { where: { dueDate: { not: null } } },
      timelineItems: true,
    },
  });

  if (!event) {
    return new NextResponse(null, { status: 404 });
  }

  const ics = buildEventCalendar(event, event.tasks, event.timelineItems);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${event.slug}.ics"`,
      "Cache-Control": "public, max-age=900",
    },
  });
}
