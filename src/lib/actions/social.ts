"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { nanoid } from "nanoid";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { requireWriteAccess, requireAdmin } from "@/lib/actions/authz";

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

  await prisma.socialPost.deleteMany({ where: { id: postId, eventId } });

  revalidatePath(`/dashboard/events/${eventId}`);
}
