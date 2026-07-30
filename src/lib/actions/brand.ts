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

const MAX_LOGO_BYTES = 2 * 1024 * 1024;

export async function updateBrand(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const brandName = (formData.get("brandName") as string | null)?.trim() || null;
  const brandColor = (formData.get("brandColor") as string | null)?.trim() || null;

  const file = formData.get("brandLogo");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      throw new Error("El archivo debe ser una imagen");
    }
    if (file.size > MAX_LOGO_BYTES) {
      throw new Error("La imagen no puede pesar más de 2MB");
    }
    const buffer = Buffer.from(await file.arrayBuffer());
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { brandName, brandColor, brandLogo: buffer, brandLogoType: file.type },
    });
  } else {
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { brandName, brandColor },
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function removeBrandLogo() {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.organizer.update({
    where: { id: organizerId },
    data: { brandLogo: null, brandLogoType: null },
  });

  revalidatePath("/dashboard/settings");
}
