"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/actions/authz";

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

async function requireProposalOwnedByOrganizer(proposalId: string, organizerId: string) {
  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, lead: { organizerId } },
  });
  if (!proposal) {
    throw new Error("Propuesta no encontrada");
  }
  return proposal;
}

export async function createProposal(leadId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  const title = (formData.get("title") as string | null)?.trim();
  if (!title) {
    throw new Error("El título es requerido");
  }
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  await prisma.proposal.create({ data: { leadId, title, notes } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteProposal(leadId: string, proposalId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireProposalOwnedByOrganizer(proposalId, organizerId);

  await prisma.proposal.delete({ where: { id: proposalId } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function addProposalItem(leadId: string, proposalId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireProposalOwnedByOrganizer(proposalId, organizerId);

  const description = (formData.get("description") as string | null)?.trim();
  if (!description) {
    throw new Error("La descripción es requerida");
  }
  const amount = parseFloat((formData.get("amount") as string | null) ?? "");
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Monto inválido");
  }

  await prisma.proposalItem.create({ data: { proposalId, description, amount } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteProposalItem(leadId: string, itemId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const item = await prisma.proposalItem.findFirst({
    where: { id: itemId, proposal: { lead: { organizerId } } },
  });
  if (!item) {
    throw new Error("Ítem no encontrado");
  }

  await prisma.proposalItem.delete({ where: { id: itemId } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}
