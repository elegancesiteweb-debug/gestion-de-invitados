"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function createVendor(formData: FormData) {
  const organizerId = await requireOrganizerId();

  const name = (formData.get("name") as string | null)?.trim();
  if (!name) {
    throw new Error("El nombre es requerido");
  }
  const category = (formData.get("category") as string | null)?.trim() || null;
  const phone = (formData.get("phone") as string | null)?.trim() || null;
  const email = (formData.get("email") as string | null)?.trim() || null;
  const notes = (formData.get("notes") as string | null)?.trim() || null;

  await prisma.vendor.create({
    data: { organizerId, name, category, phone, email, notes },
  });

  revalidatePath("/dashboard/vendors");
}

export async function deleteVendor(vendorId: string) {
  const organizerId = await requireOrganizerId();

  await prisma.vendor.deleteMany({
    where: { id: vendorId, organizerId },
  });

  revalidatePath("/dashboard/vendors");
}
