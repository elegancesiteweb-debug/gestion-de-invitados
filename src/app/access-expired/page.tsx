import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";
import { SignOutButton } from "@/components/SignOutButton";

const WHATSAPP_URL =
  "https://wa.me/523311843408?text=%C2%A1Hola%20Elegance%20Site!%20%F0%9F%92%8C%0AMe%20interesa%20renovar%20mi%20acceso%20de%20Wedding%20Planner.";

export default async function AccessExpiredPage() {
  const t = await getTranslations("accessExpiredPage");

  const session = await auth();
  const organizer = session?.user?.id
    ? await prisma.organizer.findUnique({
        where: { id: session.user.id },
        select: { accessExpiresAt: true },
      })
    : null;

  return (
    <div className="mx-auto w-full max-w-md px-4 py-20 text-center">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-8 shadow-lg backdrop-blur-xl">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="Elegance Site" className="mx-auto h-16 w-16" />
        <h1 className="mt-4 font-serif text-2xl font-medium text-ink">{t("title")}</h1>
        <p className="mt-3 text-sm text-ink-muted">
          {organizer?.accessExpiresAt
            ? t("expiredOn", { date: formatDate(organizer.accessExpiresAt, "medium") })
            : t("expired")}
        </p>
        <a
          href={WHATSAPP_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-block rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-5 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg"
        >
          {t("renewCta")}
        </a>
        <div className="mt-6 border-t border-gold/15 pt-4">
          <SignOutButton />
        </div>
      </div>
    </div>
  );
}
