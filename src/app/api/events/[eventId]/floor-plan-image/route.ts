import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { floorPlanImage: true, floorPlanImageType: true },
  });

  if (!event?.floorPlanImage) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(event.floorPlanImage), {
    headers: {
      "Content-Type": event.floorPlanImageType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
