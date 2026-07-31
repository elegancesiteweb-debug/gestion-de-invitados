import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";

export default async function PrintTimelinePage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const t = await getTranslations("timelinePrint");

  const event = await prisma.event.findFirst({
    where: { id: eventId, organizerId: session.user.id },
    include: { timelineItems: { orderBy: { time: "asc" } } },
  });
  if (!event) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link
          href={`/dashboard/events/${eventId}?tab=timeline`}
          className="text-sm text-gold-dark hover:underline"
        >
          {t("backToEvent")}
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{event.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">
          {t("daySchedule")} · {formatDate(event.eventDate)}
          {event.location ? ` · ${event.location}` : ""}
        </p>
      </header>

      {event.timelineItems.length === 0 ? (
        <p className="text-center text-sm text-ink-muted">{t("empty")}</p>
      ) : (
        <ol className="space-y-2">
          {event.timelineItems.map((item) => (
            <li
              key={item.id}
              className="flex items-baseline gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 text-sm"
            >
              <span className="font-serif text-base font-medium text-gold-dark">{item.time}</span>
              <div>
                <p className="text-ink">{item.title}</p>
                {item.responsible && <p className="text-xs text-ink-muted">{item.responsible}</p>}
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
