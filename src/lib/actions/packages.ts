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

async function requirePackageOwnedByOrganizer(packageId: string, organizerId: string) {
  const pkg = await prisma.package.findFirst({ where: { id: packageId, organizerId } });
  if (!pkg) {
    throw new Error("Paquete no encontrado");
  }
  return pkg;
}

export async function createPackage(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const description = (formData.get("description") as string | null)?.trim() || null;

  await prisma.package.create({ data: { organizerId, name, description } });

  revalidatePath("/dashboard/packages");
}

export async function deletePackage(packageId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requirePackageOwnedByOrganizer(packageId, organizerId);

  await prisma.package.delete({ where: { id: packageId } });

  revalidatePath("/dashboard/packages");
}

export async function addPackageItem(packageId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requirePackageOwnedByOrganizer(packageId, organizerId);

  const description = (formData.get("description") as string | null)?.trim();
  if (!description) {
    throw new Error("La descripción es requerida");
  }
  const amount = parseFloat((formData.get("amount") as string | null) ?? "");
  if (!Number.isFinite(amount) || amount < 0) {
    throw new Error("Monto inválido");
  }

  await prisma.packageItem.create({ data: { packageId, description, amount } });

  revalidatePath("/dashboard/packages");
}

export async function deletePackageItem(itemId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const item = await prisma.packageItem.findFirst({
    where: { id: itemId, package: { organizerId } },
  });
  if (!item) {
    throw new Error("Ítem no encontrado");
  }

  await prisma.packageItem.delete({ where: { id: itemId } });

  revalidatePath("/dashboard/packages");
}

export async function addPackageToProposal(leadId: string, proposalId: string, formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const packageId = (formData.get("packageId") as string | null)?.trim();
  if (!packageId) {
    throw new Error("Selecciona un paquete");
  }

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, leadId, lead: { organizerId } },
  });
  if (!proposal) {
    throw new Error("Propuesta no encontrada");
  }

  const pkg = await requirePackageOwnedByOrganizer(packageId, organizerId);
  const items = await prisma.packageItem.findMany({ where: { packageId: pkg.id } });

  if (items.length > 0) {
    await prisma.proposalItem.createMany({
      data: items.map((item) => ({
        proposalId,
        description: item.description,
        amount: item.amount,
      })),
    });
  }

  revalidatePath(`/dashboard/leads/${leadId}`);
}
