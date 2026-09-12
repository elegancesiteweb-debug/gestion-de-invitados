"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { randomUUID } from "crypto";
import { prisma } from "@/lib/prisma";
import { createUploadUrl, buildStorageKey, getPublicUrl, deleteObject } from "@/lib/r2";

const MAX_PHOTO_BYTES = 15 * 1024 * 1024;
const MAX_VIDEO_BYTES = 300 * 1024 * 1024;
const MAX_AUDIO_BYTES = 20 * 1024 * 1024;

async function requireEventBySocialToken(token: string) {
  const event = await prisma.event.findUnique({ where: { socialToken: token } });
  if (!event) {
    throw new Error("Muro de recuerdos no encontrado");
  }
  return event;
}

function socialCookieName(eventId: string) {
  return `social_id_${eventId}`;
}

export async function getSocialIdentity(eventId: string) {
  const cookieStore = await cookies();
  const deviceToken = cookieStore.get(socialCookieName(eventId))?.value;
  if (!deviceToken) return null;
  return prisma.socialIdentity.findFirst({ where: { deviceToken, eventId } });
}

// El "login sencillo": el invitado elige su nombre (o el de un acompañante) de la lista
// real, o escribe uno libre si no aparece. Sin contraseña — solo se recuerda en el
// dispositivo con una cookie que apunta a este registro.
export async function identifyGuest(token: string, formData: FormData) {
  const event = await requireEventBySocialToken(token);

  const pickedId = (formData.get("pickedId") as string | null)?.trim() || "";
  const customName = (formData.get("customName") as string | null)?.trim() || "";

  let displayName = "";
  let guestId: string | null = null;

  if (pickedId.startsWith("guest:")) {
    const guest = await prisma.guest.findFirst({
      where: { id: pickedId.slice("guest:".length), eventId: event.id },
    });
    if (guest) {
      displayName = guest.name;
      guestId = guest.id;
    }
  } else if (pickedId.startsWith("companion:")) {
    const companion = await prisma.companion.findFirst({
      where: { id: pickedId.slice("companion:".length), guest: { eventId: event.id } },
      include: { guest: true },
    });
    if (companion) {
      displayName = companion.name;
      guestId = companion.guest.id;
    }
  }

  if (!displayName) {
    displayName = customName;
  }
  if (!displayName) {
    throw new Error("Escribe o elige tu nombre");
  }

  const deviceToken = randomUUID();
  await prisma.socialIdentity.create({
    data: { eventId: event.id, displayName, guestId, deviceToken },
  });

  const cookieStore = await cookies();
  cookieStore.set(socialCookieName(event.id), deviceToken, {
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
    httpOnly: true,
    sameSite: "lax",
  });

  revalidatePath(`/social/${token}`);
}

export async function requestUploadUrl(token: string, contentType: string, fileSize: number) {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  const isVideo = contentType.startsWith("video/");
  const isPhoto = contentType.startsWith("image/");
  const isAudio = contentType.startsWith("audio/");
  if (!isVideo && !isPhoto && !isAudio) {
    throw new Error("Solo se aceptan fotos, videos o audios");
  }
  const maxBytes = isVideo ? MAX_VIDEO_BYTES : isAudio ? MAX_AUDIO_BYTES : MAX_PHOTO_BYTES;
  if (fileSize > maxBytes) {
    throw new Error(
      isVideo
        ? "El video no puede pesar más de 300MB"
        : isAudio
          ? "El audio no puede pesar más de 20MB"
          : "La foto no puede pesar más de 15MB"
    );
  }

  const storageKey = buildStorageKey(event.id, contentType);
  const uploadUrl = await createUploadUrl(storageKey, contentType);
  const type: "VIDEO" | "PHOTO" | "AUDIO" = isVideo ? "VIDEO" : isAudio ? "AUDIO" : "PHOTO";
  return { uploadUrl, storageKey, type };
}

export async function createSocialPost(
  token: string,
  storageKey: string,
  type: "PHOTO" | "VIDEO" | "AUDIO",
  caption: string
) {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  await prisma.socialPost.create({
    data: { eventId: event.id, identityId: identity.id, type, storageKey, caption: caption.trim() || null },
  });

  revalidatePath(`/social/${token}`);
}

export async function createSocialStory(token: string, storageKey: string, type: "PHOTO" | "VIDEO" | "AUDIO") {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  await prisma.socialStory.create({
    data: { eventId: event.id, identityId: identity.id, type, storageKey },
  });

  revalidatePath(`/social/${token}`);
}

export async function toggleLike(token: string, postId: string) {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  const post = await prisma.socialPost.findFirst({ where: { id: postId, eventId: event.id } });
  if (!post) {
    throw new Error("Publicación no encontrada");
  }

  const existing = await prisma.socialLike.findUnique({
    where: { postId_identityId: { postId, identityId: identity.id } },
  });
  if (existing) {
    await prisma.socialLike.delete({ where: { id: existing.id } });
  } else {
    await prisma.socialLike.create({ data: { postId, identityId: identity.id } });
  }

  revalidatePath(`/social/${token}`);
}

export async function createComment(token: string, postId: string, formData: FormData) {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  const body = (formData.get("body") as string | null)?.trim();
  if (!body) {
    throw new Error("Escribe un comentario");
  }

  const post = await prisma.socialPost.findFirst({ where: { id: postId, eventId: event.id } });
  if (!post) {
    throw new Error("Publicación no encontrada");
  }

  await prisma.socialComment.create({ data: { postId, identityId: identity.id, body } });

  revalidatePath(`/social/${token}`);
}

// El invitado solo puede borrar lo que él mismo subió (dueño = su propia
// identidad de cookie, no la del evento) — a diferencia de la organización,
// que borra desde el panel del organizador (setPostHidden/deleteSocialPost
// en src/lib/actions/social.ts) sin este chequeo de autoría.
export async function deleteMyPost(token: string, postId: string) {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  const post = await prisma.socialPost.findFirst({
    where: { id: postId, eventId: event.id, identityId: identity.id },
  });
  if (!post) {
    throw new Error("Publicación no encontrada");
  }

  await prisma.socialPost.delete({ where: { id: post.id } });
  try {
    await deleteObject(post.storageKey);
  } catch {
    // best-effort: si falla borrar el archivo de R2, no bloquea el borrado del registro
  }

  revalidatePath(`/social/${token}`);
}

export async function deleteMyStory(token: string, storyId: string) {
  const event = await requireEventBySocialToken(token);
  const identity = await getSocialIdentity(event.id);
  if (!identity) {
    throw new Error("Primero dinos quién eres");
  }

  const story = await prisma.socialStory.findFirst({
    where: { id: storyId, eventId: event.id, identityId: identity.id },
  });
  if (!story) {
    throw new Error("Historia no encontrada");
  }

  await prisma.socialStory.delete({ where: { id: story.id } });
  try {
    await deleteObject(story.storageKey);
  } catch {
    // best-effort: si falla borrar el archivo de R2, no bloquea el borrado del registro
  }

  revalidatePath(`/social/${token}`);
}

export type ProjectionItem = {
  id: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  url: string;
  authorName: string;
  caption: string | null;
  createdAt: string;
};

// Para la pantalla de proyección: historias activas (últimas 24h) + publicaciones no
// ocultadas por el organizador, mezcladas y ordenadas de más reciente a más antigua.
// Se llama por polling desde el cliente, no necesita sesión ni cookie de identidad.
export async function getProjectionFeed(token: string): Promise<ProjectionItem[]> {
  const event = await requireEventBySocialToken(token);

  const storiesActiveSince = new Date();
  storiesActiveSince.setDate(storiesActiveSince.getDate() - 1);

  const [posts, stories] = await Promise.all([
    prisma.socialPost.findMany({
      where: { eventId: event.id, hiddenFromProjection: false },
      include: { identity: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
    prisma.socialStory.findMany({
      where: { eventId: event.id, createdAt: { gt: storiesActiveSince } },
      include: { identity: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const items: ProjectionItem[] = [
    ...stories.map((story) => ({
      id: `story-${story.id}`,
      type: story.type,
      url: getPublicUrl(story.storageKey),
      authorName: story.identity.displayName,
      caption: null,
      createdAt: story.createdAt.toISOString(),
    })),
    ...posts.map((post) => ({
      id: `post-${post.id}`,
      type: post.type,
      url: getPublicUrl(post.storageKey),
      authorName: post.identity.displayName,
      caption: post.caption,
      createdAt: post.createdAt.toISOString(),
    })),
  ];

  return items.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
