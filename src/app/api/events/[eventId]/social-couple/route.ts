import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { socialCoupleImage: true, socialCoupleImageType: true },
  });

  if (!event?.socialCoupleImage) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(event.socialCoupleImage), {
    headers: {
      "Content-Type": event.socialCoupleImageType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
