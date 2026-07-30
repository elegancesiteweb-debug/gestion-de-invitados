"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess } from "@/lib/actions/authz";
import type { LeadQuestionType } from "@prisma/client";

const FIELD_TYPES: LeadQuestionType[] = ["TEXT", "TEXTAREA", "NUMBER"];

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function createLeadQuestion(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const label = (formData.get("label") as string | null)?.trim();
  if (!label) {
    throw new Error("La pregunta es requerida");
  }
  const fieldType = formData.get("fieldType") as LeadQuestionType | null;
  if (!fieldType || !FIELD_TYPES.includes(fieldType)) {
    throw new Error("Tipo de campo inválido");
  }
  const required = formData.get("required") === "on";

  const maxOrder = await prisma.leadQuestion.aggregate({
    where: { organizerId },
    _max: { order: true },
  });

  await prisma.leadQuestion.create({
    data: {
      organizerId,
      label,
      fieldType,
      required,
      order: (maxOrder._max.order ?? -1) + 1,
    },
  });

  revalidatePath("/dashboard/leads/questions");
}

export async function deleteLeadQuestion(questionId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.leadQuestion.deleteMany({ where: { id: questionId, organizerId } });

  revalidatePath("/dashboard/leads/questions");
}

export async function moveLeadQuestion(questionId: string, direction: "up" | "down") {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const questions = await prisma.leadQuestion.findMany({
    where: { organizerId },
    orderBy: { order: "asc" },
  });
  const index = questions.findIndex((q) => q.id === questionId);
  if (index === -1) return;

  const targetIndex = direction === "up" ? index - 1 : index + 1;
  if (targetIndex < 0 || targetIndex >= questions.length) return;

  const current = questions[index];
  const target = questions[targetIndex];

  await prisma.$transaction([
    prisma.leadQuestion.update({ where: { id: current.id }, data: { order: target.order } }),
    prisma.leadQuestion.update({ where: { id: target.id }, data: { order: current.order } }),
  ]);

  revalidatePath("/dashboard/leads/questions");
}

export async function toggleLeadIntakeForm(formData: FormData) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const enable = formData.get("enable") === "true";

  await prisma.organizer.update({
    where: { id: organizerId },
    data: { leadIntakeToken: enable ? nanoid(12) : null },
  });

  revalidatePath("/dashboard/leads/questions");
}
