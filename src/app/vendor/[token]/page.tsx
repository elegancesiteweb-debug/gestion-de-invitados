import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/dates";
import { confirmVendorParticipation } from "@/lib/actions/vendorPortal";

export default async function VendorConfirmationPage({
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
      event: { include: { timelineItems: { orderBy: { time: "asc" } } } },
    },
  });
  if (!eventVendor) {
    notFound();
  }

  const { vendor, event } = eventVendor;

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl">
        <p className="text-center text-xs uppercase tracking-[0.2em] text-gold-dark">{t("title")}</p>
        <h1 className="mt-1 text-center font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-center text-sm text-ink-muted">
          {formatDateTime(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <p className="mt-4 text-center text-sm text-ink">
          {t("greeting", { name: vendor.name })}
        </p>

        <section className="mt-6">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("schedule")}</h2>
          {event.timelineItems.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("noSchedule")}</p>
          ) : (
            <ol className="space-y-2">
              {event.timelineItems.map((item) => (
                <li
                  key={item.id}
                  className="flex items-baseline gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 text-sm shadow-sm"
                >
                  <span className="font-serif text-base font-medium text-gold-dark">{item.time}</span>
                  <div>
                    <p className="text-ink">{item.title}</p>
                    {item.responsible && (
                      <p className="text-xs text-ink-muted">{item.responsible}</p>
                    )}
                  </div>
                </li>
              ))}
            </ol>
          )}
        </section>

        <section className="mt-6 border-t border-gold/15 pt-4">
          {eventVendor.vendorConfirmed === true ? (
            <div className="rounded-lg border border-success/30 bg-success-bg p-4 text-center text-sm text-success">
              {t("youConfirmed")}
            </div>
          ) : eventVendor.vendorConfirmed === false ? (
            <div className="rounded-lg border border-danger/30 bg-danger-bg p-4 text-center text-sm text-danger">
              {t("youDeclined")}
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              <form action={confirmVendorParticipation.bind(null, token, true)} className="flex-1">
                <button
                  type="submit"
                  className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
                >
                  {t("confirmParticipation")}
                </button>
              </form>
              <form action={confirmVendorParticipation.bind(null, token, false)} className="flex-1">
                <button
                  type="submit"
                  className="w-full rounded-lg border border-danger/30 px-4 py-2 text-sm font-medium text-danger hover:bg-danger-bg"
                >
                  {t("cantAttend")}
                </button>
              </form>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
