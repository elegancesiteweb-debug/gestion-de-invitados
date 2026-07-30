import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ organizerId: string }> }
) {
  const { organizerId } = await params;

  const organizer = await prisma.organizer.findUnique({
    where: { id: organizerId },
    select: { brandLogo: true, brandLogoType: true },
  });

  if (!organizer?.brandLogo) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(organizer.brandLogo), {
    headers: {
      "Content-Type": organizer.brandLogoType ?? "application/octet-stream",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
