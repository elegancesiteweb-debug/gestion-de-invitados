import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/dates";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import {
  createVendorItineraryItem,
  deleteVendorItineraryItem,
  importVendorItineraryCsv,
} from "@/lib/actions/vendorItinerary";

export default async function VendorItineraryPage({
  params,
}: {
  params: Promise<{ eventId: string; eventVendorId: string }>;
}) {
  const { eventId, eventVendorId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const t = await getTranslations("vendorItinerary");

  const eventVendor = await prisma.eventVendor.findFirst({
    where: { id: eventVendorId, eventId, event: { organizerId: session.user.id } },
    include: {
      vendor: true,
      event: { select: { title: true } },
      itineraryItems: { orderBy: { time: "asc" } },
      comments: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!eventVendor) {
    notFound();
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const vendorUrl = `${baseUrl}/vendor/${eventVendor.confirmationToken}`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href={`/dashboard/events/${eventId}?tab=proveedores`} className="text-sm text-gold-dark hover:underline">
        {t("backToVendors")}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-serif text-2xl font-medium text-ink">{eventVendor.vendor.name}</h1>
          {eventVendor.vendor.category && (
            <p className="text-sm text-ink-muted">{eventVendor.vendor.category}</p>
          )}
        </div>
        <div className="flex items-center gap-3">
          <CopyLinkButton url={vendorUrl} />
          <Link href={`/vendor/${eventVendor.confirmationToken}/print`} className="text-sm text-gold-dark hover:underline">
            {t("printItinerary")}
          </Link>
        </div>
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addTitle")}</h2>
        <form
          action={createVendorItineraryItem.bind(null, eventId, eventVendorId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("time")}</label>
            <input
              name="time"
              type="time"
              required
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("activity")}</label>
            <input
              name="title"
              required
              placeholder={t("activityPlaceholder")}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("notes")}</label>
            <input name="notes" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("add")}
          </button>
        </form>

        <details className="mt-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2 shadow-sm backdrop-blur-xl">
          <summary className="cursor-pointer text-sm font-medium">{t("importCsv")}</summary>
          <form
            action={importVendorItineraryCsv.bind(null, eventId, eventVendorId)}
            className="mt-3 space-y-2"
          >
            <p className="text-xs text-ink-muted">{t("csvColumns")}</p>
            <input type="file" name="file" accept=".csv" required className="text-sm" />
            <button
              type="submit"
              className="block rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
            >
              {t("import")}
            </button>
          </form>
        </details>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("scheduleTitle", { count: eventVendor.itineraryItems.length })}
        </h2>
        {eventVendor.itineraryItems.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("empty")}</p>
        ) : (
          <ol className="space-y-2">
            {eventVendor.itineraryItems.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 shadow-sm backdrop-blur-xl"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-base font-medium text-gold-dark">{item.time}</span>
                  <div>
                    <p className="text-sm text-ink">{item.title}</p>
                    {item.notes && <p className="text-xs text-ink-muted">{item.notes}</p>}
                  </div>
                </div>
                <form action={deleteVendorItineraryItem.bind(null, eventId, eventVendorId, item.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    {t("delete")}
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("comments")}</h2>
        {eventVendor.comments.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noComments")}</p>
        ) : (
          <ul className="space-y-2">
            {eventVendor.comments.map((comment) => (
              <li
                key={comment.id}
                className="rounded-lg border border-gold/20 bg-white/60 p-3 text-sm shadow-sm backdrop-blur-xl"
              >
                <p className="text-ink">{comment.body}</p>
                <p className="mt-1 text-xs text-ink-muted">{formatDateTime(comment.createdAt)}</p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
