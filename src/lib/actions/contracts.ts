"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/actions/authz";
import { notifyOrganizer } from "@/lib/email";

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

export async function createContract(leadId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  const title = (formData.get("title") as string | null)?.trim();
  const content = (formData.get("content") as string | null)?.trim();
  if (!title || !content) {
    throw new Error("El título y el contenido son requeridos");
  }

  await prisma.contract.create({
    data: { leadId, title, content, token: nanoid(16) },
  });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function deleteContract(leadId: string, contractId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireLeadOwnedByOrganizer(leadId, organizerId);

  await prisma.contract.deleteMany({ where: { id: contractId, leadId } });

  revalidatePath(`/dashboard/leads/${leadId}`);
}

export async function signContract(token: string, formData: FormData) {
  const signerName = (formData.get("signerName") as string | null)?.trim();
  const agreed = formData.get("agreed") === "on";
  if (!signerName || !agreed) {
    throw new Error("Escribe tu nombre completo y marca la casilla de firma electrónica");
  }

  const contract = await prisma.contract.findUnique({
    where: { token },
    include: { lead: { include: { organizer: true } } },
  });
  if (!contract) {
    throw new Error("Contrato no encontrado");
  }
  if (contract.signedAt) {
    return;
  }

  const headersList = await headers();
  const signerIp =
    headersList.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headersList.get("x-real-ip") ||
    null;

  await prisma.contract.update({
    where: { token },
    data: { signedAt: new Date(), signerName, signerIp },
  });

  revalidatePath(`/sign/${token}`);

  await notifyOrganizer(
    contract.lead.organizer,
    `Contrato firmado: ${contract.title}`,
    `${signerName} firmó el contrato "${contract.title}" de ${contract.lead.name}.`
  );
}
