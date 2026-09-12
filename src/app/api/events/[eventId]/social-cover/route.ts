import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;

  const event = await prisma.event.findUnique({
    where: { id: eventId },
    select: { socialCoverImage: true, socialCoverImageType: true },
  });

  if (!event?.socialCoverImage) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(event.socialCoverImage), {
    headers: {
      "Content-Type": event.socialCoverImageType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
