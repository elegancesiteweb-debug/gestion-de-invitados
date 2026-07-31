import Link from "next/link";
import { getTranslations } from "next-intl/server";
import type { TimelineItem } from "@prisma/client";
import { createTimelineItem, deleteTimelineItem, importTimelineCsv } from "@/lib/actions/timeline";

export async function TimelinePanel({
  eventId,
  items,
}: {
  eventId: string;
  items: TimelineItem[];
}) {
  const t = await getTranslations("timeline");
  const sorted = [...items].sort((a, b) => a.time.localeCompare(b.time));

  return (
    <div className="space-y-6 py-6">
      <section>
        <div className="mb-3 flex items-center justify-between gap-3">
          <h2 className="font-serif text-lg font-medium text-ink">{t("addTitle")}</h2>
          <Link
            href={`/dashboard/events/${eventId}/timeline/print`}
            className="text-sm text-gold-dark hover:underline"
          >
            {t("exportPrint")}
          </Link>
        </div>
        <form
          action={createTimelineItem.bind(null, eventId)}
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
          <div>
            <label className="block text-xs font-medium mb-1">{t("responsible")}</label>
            <input
              name="responsible"
              placeholder={t("responsiblePlaceholder")}
              className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
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
          <form action={importTimelineCsv.bind(null, eventId)} className="mt-3 space-y-2">
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

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("scheduleTitle", { count: sorted.length })}
        </h2>
        {sorted.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("empty")}</p>
        ) : (
          <ol className="space-y-2">
            {sorted.map((item) => (
              <li
                key={item.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 px-4 py-2.5 shadow-sm backdrop-blur-xl"
              >
                <div className="flex items-baseline gap-3">
                  <span className="font-serif text-base font-medium text-gold-dark">
                    {item.time}
                  </span>
                  <div>
                    <p className="text-sm text-ink">{item.title}</p>
                    {item.responsible && (
                      <p className="text-xs text-ink-muted">
                        {t("responsibleFor", { name: item.responsible })}
                      </p>
                    )}
                  </div>
                </div>
                <form action={deleteTimelineItem.bind(null, eventId, item.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    {t("delete")}
                  </button>
                </form>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  );
}
