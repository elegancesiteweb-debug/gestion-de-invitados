"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { encryptSecret } from "@/lib/crypto";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

export async function updateResendCredentials(formData: FormData) {
  const organizerId = await requireOrganizerId();

  const apiKey = (formData.get("apiKey") as string | null)?.trim();
  const fromEmail = (formData.get("fromEmail") as string | null)?.trim() || null;

  await prisma.organizer.update({
    where: { id: organizerId },
    data: {
      ...(apiKey ? { resendApiKey: encryptSecret(apiKey) } : {}),
      resendFromEmail: fromEmail,
    },
  });

  revalidatePath("/dashboard/settings");
}

export async function removeResendCredentials() {
  const organizerId = await requireOrganizerId();

  await prisma.organizer.update({
    where: { id: organizerId },
    data: { resendApiKey: null, resendFromEmail: null },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateStripeCredentials(formData: FormData) {
  const organizerId = await requireOrganizerId();

  const secretKey = (formData.get("secretKey") as string | null)?.trim();
  if (secretKey) {
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { stripeSecretKey: encryptSecret(secretKey) },
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function removeStripeCredentials() {
  const organizerId = await requireOrganizerId();

  await prisma.organizer.update({ where: { id: organizerId }, data: { stripeSecretKey: null } });

  revalidatePath("/dashboard/settings");
}

export async function updateMercadoPagoCredentials(formData: FormData) {
  const organizerId = await requireOrganizerId();

  const accessToken = (formData.get("accessToken") as string | null)?.trim();
  if (accessToken) {
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { mercadoPagoAccessToken: encryptSecret(accessToken) },
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function removeMercadoPagoCredentials() {
  const organizerId = await requireOrganizerId();

  await prisma.organizer.update({
    where: { id: organizerId },
    data: { mercadoPagoAccessToken: null },
  });

  revalidatePath("/dashboard/settings");
}

export async function updateClipCredentials(formData: FormData) {
  const organizerId = await requireOrganizerId();

  const apiKey = (formData.get("apiKey") as string | null)?.trim();
  if (apiKey) {
    await prisma.organizer.update({
      where: { id: organizerId },
      data: { clipApiKey: encryptSecret(apiKey) },
    });
  }

  revalidatePath("/dashboard/settings");
}

export async function removeClipCredentials() {
  const organizerId = await requireOrganizerId();

  await prisma.organizer.update({ where: { id: organizerId }, data: { clipApiKey: null } });

  revalidatePath("/dashboard/settings");
}
