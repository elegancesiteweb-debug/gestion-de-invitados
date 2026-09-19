import { NextResponse } from "next/server";
import { ZipArchive } from "archiver";
import { Readable } from "stream";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getObjectStream } from "@/lib/r2";

function slugifyName(name: string): string {
  const slug = name
    .replace(/[^a-zA-Z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return slug || "invitado";
}

function extensionFromKey(storageKey: string): string {
  const match = storageKey.match(/\.([a-zA-Z0-9]+)$/);
  return match ? match[1] : "bin";
}

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.user.id },
  });
  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  const [posts, stories] = await Promise.all([
    prisma.socialPost.findMany({
      where: { eventId },
      include: { identity: { select: { displayName: true } }, media: { orderBy: { order: "asc" } } },
      orderBy: { createdAt: "asc" },
    }),
    prisma.socialStory.findMany({
      where: { eventId },
      include: { identity: { select: { displayName: true } } },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  // Las fotos adicionales de un carrusel (SocialPostMedia) se aplanan al mismo
  // formato — mismo autor y fecha que su publicación, para que el .zip traiga
  // todas las fotos, no solo la primera de cada carrusel.
  const items = [
    ...posts.flatMap((post) => [
      { storageKey: post.storageKey, identity: post.identity, createdAt: post.createdAt },
      ...post.media.map((m) => ({ storageKey: m.storageKey, identity: post.identity, createdAt: post.createdAt })),
    ]),
    ...stories,
  ];

  const archive = new ZipArchive({ zlib: { level: 6 } });
  archive.on("warning", (err: Error) => console.error("social-zip warning:", err));
  archive.on("error", (err: Error) => console.error("social-zip error:", err));

  // Se agregan en segundo plano mientras el stream ya va respondiendo — si un
  // archivo individual falla al leerse de R2, se salta y se sigue con los demás
  // en vez de tirar todo el .zip.
  (async () => {
    for (const [index, item] of items.entries()) {
      try {
        const stream = await getObjectStream(item.storageKey);
        const filename = `${index + 1}-${slugifyName(item.identity.displayName)}-${item.createdAt
          .toISOString()
          .slice(0, 10)}.${extensionFromKey(item.storageKey)}`;
        archive.append(stream, { name: filename });
      } catch (err) {
        console.error(`social-zip: no se pudo leer ${item.storageKey}`, err);
      }
    }
    archive.finalize();
  })();

  const filename = `recuerdos-${event.slug}.zip`;

  return new NextResponse(Readable.toWeb(archive) as unknown as ReadableStream, {
    headers: {
      "Content-Type": "application/zip",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
