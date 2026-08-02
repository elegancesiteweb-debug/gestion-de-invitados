"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/accessCode";
import { extendAccess } from "@/lib/accessExpiry";

async function requireAdmin() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    throw new Error("No autorizado");
  }
}

export async function createAccessCode(formData: FormData) {
  await requireAdmin();

  const accountType = formData.get("accountType") === "PLANNER" ? "PLANNER" : "INDIVIDUAL";
  const label = (formData.get("label") as string | null)?.trim() || null;
  // La duración solo tiene sentido para Wedding Planner; Particular siempre queda sin vencimiento.
  const durationRaw = formData.get("durationMonths") as string | null;
  const durationMonths =
    accountType === "PLANNER" && (durationRaw === "1" || durationRaw === "12")
      ? parseInt(durationRaw, 10)
      : null;

  let code = generateAccessCode(accountType);
  // Extremely unlikely collision, but guard against it rather than assume uniqueness.
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.accessCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateAccessCode(accountType);
  }

  await prisma.accessCode.create({
    data: { code, accountType, label, durationMonths },
  });

  redirect(`/dashboard/admin?created=${encodeURIComponent(code)}`);
}

export async function renewPlannerAccess(organizerId: string, formData: FormData) {
  await requireAdmin();

  const durationRaw = formData.get("durationMonths") as string | null;
  const durationMonths = durationRaw === "12" ? 12 : 1;

  const organizer = await prisma.organizer.findFirst({
    where: { id: organizerId, accountType: "PLANNER" },
  });
  if (!organizer) {
    throw new Error("Wedding Planner no encontrado");
  }

  const accessExpiresAt = extendAccess(organizer.accessExpiresAt, durationMonths);

  await prisma.organizer.update({
    where: { id: organizerId },
    data: { accessExpiresAt },
  });

  revalidatePath("/dashboard/admin");
}
