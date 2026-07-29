"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { rsvpSchema } from "@/lib/validations";

export async function submitRsvp(token: string, formData: FormData) {
  const guest = await prisma.guest.findUnique({ where: { token } });
  if (!guest) {
    return { error: "Invitación no encontrada" };
  }

  const parsed = rsvpSchema.safeParse({
    status: formData.get("status"),
    companionsConfirmed: formData.get("companionsConfirmed") || 0,
    messageFromGuest: formData.get("messageFromGuest") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const { status, companionsConfirmed, messageFromGuest } = parsed.data;

  if (companionsConfirmed > guest.maxCompanions) {
    return {
      error: `Puedes confirmar como máximo ${guest.maxCompanions} acompañante(s)`,
    };
  }

  await prisma.guest.update({
    where: { token },
    data: {
      status,
      companionsConfirmed: status === "CONFIRMED" ? companionsConfirmed : 0,
      messageFromGuest: messageFromGuest || null,
      respondedAt: new Date(),
    },
  });

  revalidatePath(`/c/${token}`);
  return { ok: true };
}
