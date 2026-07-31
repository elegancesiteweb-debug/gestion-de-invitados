import Link from "next/link";
import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/dates";

export default async function VendorsPortalPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("vendorsPortal");

  const event = await prisma.event.findUnique({
    where: { vendorsPortalToken: token },
    include: { eventVendors: { orderBy: { createdAt: "asc" }, include: { vendor: true } } },
  });
  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-lg px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-gold-dark">{t("title")}</p>
        <h1 className="mt-1 text-center font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          {formatDate(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="mt-4 text-center text-sm text-ink">{t("chooseYourName")}</p>

        {event.eventVendors.length === 0 ? (
          <p className="mt-4 text-center text-sm text-ink-muted">{t("noVendors")}</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {event.eventVendors.map((ev) => (
              <li key={ev.id}>
                <Link
                  href={`/vendor/${ev.confirmationToken}`}
                  className="block rounded-lg border border-gold/20 bg-white/70 px-4 py-2.5 text-center text-sm font-medium text-ink hover:border-gold/40 hover:bg-warm"
                >
                  {ev.vendor.name}
                  {ev.vendor.category && (
                    <span className="ml-2 text-xs font-normal text-ink-muted">({ev.vendor.category})</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
