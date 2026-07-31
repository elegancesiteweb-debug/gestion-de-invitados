import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ documentId: string }> }
) {
  const { documentId } = await params;

  const document = await prisma.eventDocument.findUnique({
    where: { id: documentId },
    select: { file: true, fileType: true, name: true },
  });

  if (!document) {
    return new NextResponse(null, { status: 404 });
  }

  return new NextResponse(new Uint8Array(document.file), {
    headers: {
      "Content-Type": document.fileType,
      "Content-Disposition": `attachment; filename="${encodeURIComponent(document.name)}"`,
      "Cache-Control": "public, max-age=3600",
    },
  });
}
