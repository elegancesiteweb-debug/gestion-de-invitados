import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { buildOrganizerCalendar } from "@/lib/ics";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;

  const organizer = await prisma.organizer.findUnique({
    where: { masterCalendarToken: token },
    include: {
      events: {
        include: {
          tasks: { where: { dueDate: { not: null } } },
          timelineItems: true,
        },
      },
    },
  });

  if (!organizer) {
    return new NextResponse(null, { status: 404 });
  }

  const ics = buildOrganizerCalendar(organizer.events);

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="calendario-eventos.ics"`,
      "Cache-Control": "public, max-age=900",
    },
  });
}
