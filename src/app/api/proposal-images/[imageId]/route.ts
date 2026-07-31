import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ imageId: string }> }
) {
  const { imageId } = await params;

  const image = await prisma.proposalImage.findUnique({
    where: { id: imageId },
    select: { image: true, imageType: true },
  });

  if (!image) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(image.image), {
    headers: {
      "Content-Type": image.imageType,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
