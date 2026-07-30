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

export async function updateNotificationSettings(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const notifyByEmail = formData.get("notifyByEmail") === "on";

  await prisma.organizer.update({ where: { id: organizerId }, data: { notifyByEmail } });

  revalidatePath("/dashboard/settings");
}
