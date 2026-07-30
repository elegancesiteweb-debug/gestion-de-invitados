"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import type { LeadStage } from "@prisma/client";

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
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  await prisma.lead.delete({ where: { id: leadId } });

  revalidatePath("/dashboard/leads");
  redirect("/dashboard/leads");
}
