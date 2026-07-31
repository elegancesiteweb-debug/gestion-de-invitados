import { NextResponse } from "next/server";
import Papa from "papaparse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
    include: { guests: { orderBy: { name: "asc" }, include: { companions: true } } },
  });

  if (!event) {
    return NextResponse.json({ error: "Evento no encontrado" }, { status: 404 });
  }

  const TAG_LABELS: Record<string, string> = {
    vip: "VIP",
    withKids: "Con niños",
    family: "Familia",
    friends: "Amigos",
    work: "Trabajo",
  };

  const rows = event.guests.map((guest) => ({
    Nombre: guest.name,
    Mesa: guest.tableName ?? "",
    Estado:
      guest.status === "CONFIRMED"
        ? "Confirmado"
        : guest.status === "DECLINED"
          ? "No asiste"
          : "Pendiente",
    Personas: guest.status === "CONFIRMED" ? 1 + (guest.companionsConfirmed ?? 0) : "",
    Acompañantes: guest.companions
      .map((c) => `${c.name}${c.attending ? "" : " (no asiste)"}`)
      .join(", "),
    Etiquetas: guest.tags.map((tag) => TAG_LABELS[tag] ?? tag).join(", "),
    "Restricción alimentaria": guest.dietaryNotes ?? "",
    Mensaje: guest.messageFromGuest ?? "",
  }));

  const csv = Papa.unparse(rows);
  const filename = `confirmaciones-${event.slug}.csv`;

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
