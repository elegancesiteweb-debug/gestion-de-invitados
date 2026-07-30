import { NextResponse } from "next/server";
import Papa from "papaparse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUOTED: "Cotizado",
  WON: "Ganado",
  LOST: "Perdido",
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  if (!hasFeature(session.user.accountType, "business_reports")) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 });
  }

  const leads = await prisma.lead.findMany({
    where: { organizerId: session.user.id },
    include: { invoices: true },
    orderBy: { createdAt: "asc" },
  });

  const leadRows = leads.map((lead) => ({
    Lead: lead.name,
    Etapa: STAGE_LABELS[lead.stage] ?? lead.stage,
    Email: lead.email ?? "",
    Teléfono: lead.phone ?? "",
  }));

  const invoiceRows = leads.flatMap((lead) =>
    lead.invoices.map((invoice) => ({
      Lead: lead.name,
      Descripción: invoice.description,
      Monto: invoice.amount,
      Moneda: invoice.currency,
      Estado: invoice.status === "paid" ? "Pagada" : "Pendiente",
      "Fecha de pago": invoice.paidAt ? invoice.paidAt.toISOString().slice(0, 10) : "",
      "Fecha límite": invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : "",
    }))
  );

  const csv = [
    "LEADS",
    Papa.unparse(leadRows),
    "",
    "FACTURAS",
    Papa.unparse(invoiceRows),
  ].join("\n");

  return new NextResponse(`﻿${csv}`, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="reportes.csv"`,
    },
  });
}
