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

const MAX_IMAGE_BYTES = 2 * 1024 * 1024;

export async function uploadProposalImage(leadId: string, proposalId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireProposalOwnedByOrganizer(proposalId, organizerId);

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }
  if (file.size > MAX_IMAGE_BYTES) {
    throw new Error("La imagen no puede pesar más de 2MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  await prisma.proposalImage.create({
    data: { proposalId, image: buffer, imageType: file.type },
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteProposalImage(leadId: string, imageId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const image = await prisma.proposalImage.findFirst({
    where: { id: imageId, proposal: { lead: { organizerId } } },
  });
  if (!image) {
    throw new Error("Imagen no encontrada");
  }

  await prisma.proposalImage.delete({ where: { id: imageId } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function replyToProposalComment(leadId: string, proposalId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireProposalOwnedByOrganizer(proposalId, organizerId);

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) {
    throw new Error("Escribe un mensaje");
  }

  await prisma.proposalComment.create({
    data: { proposalId, authorType: "ORGANIZER", body },
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
}
