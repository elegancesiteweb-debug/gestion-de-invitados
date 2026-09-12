"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { unstable_update } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { generateAccessCode } from "@/lib/accessCode";
import { extendAccess } from "@/lib/accessExpiry";
import { requireAdmin } from "@/lib/actions/authz";

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

export async function impersonateOrganizer(organizerId: string) {
  await requireAdmin();

  // Alcance limitado a Particular a propósito — Wedding Planner nunca aparece como opción.
  const organizer = await prisma.organizer.findFirst({
    where: { id: organizerId, accountType: "INDIVIDUAL" },
  });
  if (!organizer) {
    throw new Error("Cliente Particular no encontrado");
  }

  // Estos campos son señales transitorias solo para el callback jwt() (ver src/lib/auth.ts),
  // no forman parte de la forma real de Session — de ahí el cast.
  await unstable_update({
    impersonateOrganizerId: organizer.id,
    impersonateName: organizer.name,
    impersonateAccountType: organizer.accountType,
  } as Parameters<typeof unstable_update>[0]);

  const events = await prisma.event.findMany({
    where: { organizerId: organizer.id },
    select: { id: true },
  });

  if (events.length === 1) {
    redirect(`/dashboard/events/${events[0].id}`);
  }
  redirect("/dashboard");
}

export async function stopImpersonation() {
  await unstable_update({ stopImpersonation: true } as Parameters<typeof unstable_update>[0]);
  redirect("/dashboard/admin");
}
