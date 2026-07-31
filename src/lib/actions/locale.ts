"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { LOCALE_COOKIE, type AppLocale } from "@/lib/locale";

export async function setLocale(locale: AppLocale) {
  const cookieStore = await cookies();
  cookieStore.set(LOCALE_COOKIE, locale, {
    maxAge: 60 * 60 * 24 * 365,
    path: "/",
  });

  const session = await auth();
  if (session?.user?.id) {
    await prisma.organizer.update({ where: { id: session.user.id }, data: { locale } }).catch(() => {});
  }

  revalidatePath("/", "layout");
}
