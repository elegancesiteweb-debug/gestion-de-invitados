"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
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

export async function toggleMasterCalendar(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const enable = formData.get("enable") === "true";

  await prisma.organizer.update({
    where: { id: organizerId },
    data: { masterCalendarToken: enable ? nanoid(12) : null },
  });

  revalidatePath("/dashboard");
}
