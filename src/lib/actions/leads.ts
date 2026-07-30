"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import Papa from "papaparse";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadStage } from "@prisma/client";
import { requireWriteAccess } from "@/lib/actions/authz";

const LEAD_STAGES: LeadStage[] = ["NEW", "CONTACTED", "QUOTED", "WON", "LOST"];

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

async function requireLeadOwnedByOrganizer(leadId: string, organizerId: string) {
  const lead = await prisma.lead.findFirst({ where: { id: leadId, organizerId } });
  if (!lead) {
    throw new Error("Lead no encontrado");
  }
  return lead;
}

export async function createLead(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  await prisma.lead.create({
    data: { organizerId, name, email, phone, notes },
  });

  revalidatePath("/dashboard/leads");
}

export async function updateLead(leadId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  await prisma.lead.update({
    where: { id: leadId },
    data: { name, email, phone, notes },
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function updateLeadStage(leadId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  const stage = formData.get("stage") as LeadStage | null;
  if (!stage || !LEAD_STAGES.includes(stage)) {
    throw new Error("Etapa inválida");
  }

  await prisma.lead.update({ where: { id: leadId }, data: { stage } });

  revalidatePath("/dashboard/leads");
  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteLead(leadId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  await prisma.lead.delete({ where: { id: leadId } });

  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}

export async function importLeadsCsv(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const file = formData.get("file");
  if (!(file instanceof File)) {
    throw new Error("Archivo CSV requerido");
  }

  const text = await file.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  });

  const rows = data
    .map((row) => ({
      name: (row.name || row.nombre || "").trim(),
      email: (row.email || "").trim(),
      phone: (row.phone || row.telefono || row.teléfono || "").trim(),
      notes: (row.notes || row.notas || "").trim(),
    }))
    .filter((row) => row.name.length > 0);

  if (rows.length === 0) {
    throw new Error("El CSV no contiene leads válidos (se requiere columna 'name' o 'nombre')");
  }

  await prisma.lead.createMany({
    data: rows.map((row) => ({
      organizerId,
      name: row.name,
      email: row.email || null,
      phone: row.phone || null,
      notes: row.notes || null,
    })),
  });

  revalidatePath("/dashboard/leads");
}

export async function submitLeadIntake(token: string, formData: FormData) {
  const organizer = await prisma.organizer.findUnique({
    where: { leadIntakeToken: token },
    include: { leadQuestions: { orderBy: { order: "asc" } } },
  });
  if (!organizer) {
    throw new Error("Formulario no encontrado");
  }

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const email = (formData.get("email") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  const intakeAnswers = organizer.leadQuestions
    .map((question) => {
      const value = (formData.get(`question_${question.id}`) as string | null)?.trim();
      if (!value) return null;
      return { questionId: question.id, label: question.label, value };
    })
    .filter((entry): entry is { questionId: string; label: string; value: string } => entry !== null);

  await prisma.lead.create({
    data: {
      organizerId: organizer.id,
      name,
      email,
      phone,
      notes,
      intakeAnswers,
    },
  });

  redirect(`/quote/${token}?sent=1`);
}
