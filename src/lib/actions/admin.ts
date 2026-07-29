"use server";

import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/accessCode";

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

  let code = generateAccessCode(accountType);
  // Extremely unlikely collision, but guard against it rather than assume uniqueness.
  for (let attempts = 0; attempts < 5; attempts++) {
    const existing = await prisma.accessCode.findUnique({ where: { code } });
    if (!existing) break;
    code = generateAccessCode(accountType);
  }

  await prisma.accessCode.create({
    data: { code, accountType, label },
  });

  redirect(`/dashboard/admin?created=${encodeURIComponent(code)}`);
}
