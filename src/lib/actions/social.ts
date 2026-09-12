"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, requireAdmin } from "@/lib/actions/authz";
import { deleteObject } from "@/lib/r2";

async function requireOrganizerId() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  return session.user.id;
}

async function requireEventOwnedByOrganizer(eventId: string, organizerId: string) {
  const event = await prisma.event.findFirst({ where: { id: eventId, organizerId } });
  if (!event) {
    throw new Error("Evento no encontrado");
  }
  return event;
}

// El acceso al muro de recuerdos ya no lo activa cada organizador: lo decide
// el admin de Elegance Site, evento por evento, desde /dashboard/admin.
export async function toggleSocialWall(eventId: string, formData: FormData) {
  await requireAdmin();

  const enable = formData.get("enable") === "true";

  await prisma.event.update({
    where: { id: eventId },
    data: { socialToken: enable ? nanoid(12) : null },
  });

  revalidatePath("/dashboard/admin");
  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function setPostHidden(eventId: string, postId: string, hidden: boolean) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  await prisma.socialPost.updateMany({
    where: { id: postId, eventId },
    data: { hiddenFromProjection: hidden },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function deleteSocialPost(eventId: string, postId: string) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();
  await requireEventOwnedByOrganizer(eventId, organizerId);

  const post = await prisma.socialPost.findFirst({ where: { id: postId, eventId } });
  if (!post) {
    throw new Error("Publicación no encontrada");
  }

  await prisma.socialPost.delete({ where: { id: post.id } });
  try {
    await deleteObject(post.storageKey);
  } catch {
    // best-effort: si falla borrar el archivo de R2, no bloquea el borrado del registro
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

const MAX_SOCIAL_IMAGE_BYTES = 5 * 1024 * 1024;

async function uploadSocialImage(
  eventId: string,
  formData: FormData,
  fieldName: string,
  column: "socialCoverImage" | "socialCoupleImage"
) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  const file = formData.get(fieldName);
  if (!(file instanceof File) || file.size === 0) {
    throw new Error("Selecciona una imagen");
  }
  if (!file.type.startsWith("image/")) {
    throw new Error("El archivo debe ser una imagen");
  }
  if (file.size > MAX_SOCIAL_IMAGE_BYTES) {
    throw new Error("La imagen no puede pesar más de 5MB");
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const result = await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { [column]: buffer, [`${column}Type`]: file.type },
  });
  if (result.count === 0) {
    throw new Error("Evento no encontrado");
  }

  revalidatePath(`/dashboard/events/${eventId}`);
}

async function removeSocialImage(
  eventId: string,
  column: "socialCoverImage" | "socialCoupleImage"
) {
  const organizerId = await requireOrganizerId();
  await requireWriteAccess();

  await prisma.event.updateMany({
    where: { id: eventId, organizerId },
    data: { [column]: null, [`${column}Type`]: null },
  });

  revalidatePath(`/dashboard/events/${eventId}`);
}

export async function uploadSocialCoverImage(eventId: string, formData: FormData) {
  await uploadSocialImage(eventId, formData, "cover", "socialCoverImage");
}

export async function removeSocialCoverImage(eventId: string) {
  await removeSocialImage(eventId, "socialCoverImage");
}

export async function uploadSocialCoupleImage(eventId: string, formData: FormData) {
  await uploadSocialImage(eventId, formData, "couple", "socialCoupleImage");
}

export async function removeSocialCoupleImage(eventId: string) {
  await removeSocialImage(eventId, "socialCoupleImage");
}
