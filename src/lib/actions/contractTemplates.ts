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

export async function createContractTemplate(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const name = (formData.get("name") as string | null)?.trim();
  const content = (formData.get("content") as string | null)?.trim();
  if (!name || !content) {
    throw new Error("El nombre y el contenido son requeridos");
  }

  await prisma.contractTemplate.create({ data: { organizerId, name, content } });

  revalidatePath("/dashboard/contract-templates");
}

export async function deleteContractTemplate(templateId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.contractTemplate.deleteMany({ where: { id: templateId, organizerId } });

  revalidatePath("/dashboard/contract-templates");
}
