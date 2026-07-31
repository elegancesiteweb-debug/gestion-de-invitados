import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";

export default async function PrintVendorItineraryPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("vendorPortal");

  const eventVendor = await prisma.eventVendor.findUnique({
    where: { confirmationToken: token },
    include: {
      vendor: true,
      event: true,
      itineraryItems: { orderBy: { time: "asc" } },
    },
  });
  if (!eventVendor) {
    notFound();
  }

  const { vendor, event } = eventVendor;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex justify-end print:hidden">
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {formatDate(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="mt-2 text-sm font-medium text-gold-dark">{vendor.name}</p>
      </header>

      {eventVendor.itineraryItems.length === 0 ? (
        <p className="text-center text-sm text-ink-muted">{t("noSchedule")}</p>
      ) : (
        <ol className="space-y-2">
          {eventVendor.itineraryItems.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 text-sm"
            >
              <span className="font-serif text-base font-medium text-gold-dark">{item.time}</span>
              <div>
                <p className="text-ink">{item.title}</p>
                {item.notes && <p className="text-xs text-ink-muted">{item.notes}</p>}
              </div>
            </li>
          ))}
        </ol>
      )}

      <p className="mt-8 text-center text-xs text-ink-light">
        {t("generatedOn", { date: formatDate(new Date()) })}
      </p>
    </div>
  );
}
