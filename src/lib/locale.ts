import { cookies } from "next/headers";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export const LOCALE_COOKIE = "locale";
export const DEFAULT_LOCALE = "es";
export const SUPPORTED_LOCALES = ["es", "en"] as const;
export type AppLocale = (typeof SUPPORTED_LOCALES)[number];

export async function getUserLocale(): Promise<AppLocale> {
  const cookieStore = await cookies();
  const cookieValue = cookieStore.get(LOCALE_COOKIE)?.value;
  if (cookieValue === "en" || cookieValue === "es") {
    return cookieValue;
  }

  const session = await auth();
  if (session?.user?.id) {
    const organizer = await prisma.organizer.findUnique({
      where: { id: session.user.id },
      select: { locale: true },
    });
    if (organizer?.locale === "en") {
      return "en";
    }
  }

  return DEFAULT_LOCALE;
}
