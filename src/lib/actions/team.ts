"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/actions/authz";
import type { TeamRole } from "@prisma/client";

const TEAM_ROLES: TeamRole[] = ["ADMIN", "COLLABORATOR"];

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function inviteTeamMember(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const name = (formData.get("name") as string | null)?.trim();
  const email = (formData.get("email") as string | null)?.trim();
  const password = (formData.get("password") as string | null) ?? "";
  const role = formData.get("role") as TeamRole | null;

  if (!name || !email) {
    throw new Error("El nombre y el email son requeridos");
  }
  if (password.length < 8) {
    throw new Error("La contraseña debe tener al menos 8 caracteres");
  }
  if (!role || !TEAM_ROLES.includes(role)) {
    throw new Error("Rol inválido");
  }

  const existingOrganizer = await prisma.organizer.findUnique({ where: { email } });
  const existingTeamMember = await prisma.teamMember.findUnique({ where: { email } });
  if (existingOrganizer || existingTeamMember) {
    throw new Error("Ya existe una cuenta con ese email");
  }

  const passwordHash = await bcrypt.hash(password, 10);

  await prisma.teamMember.create({
    data: { organizerId, name, email, passwordHash, role },
  });

  revalidatePath("/dashboard/team");
}

export async function removeTeamMember(teamMemberId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.teamMember.deleteMany({ where: { id: teamMemberId, organizerId } });

  revalidatePath("/dashboard/team");
}
