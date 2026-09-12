"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toggleSocialWall } from "@/lib/actions/social";

type EventRow = {
  id: string;
  title: string;
  socialToken: string | null;
  organizerName: string;
  organizerEmail: string;
  accountType: "INDIVIDUAL" | "PLANNER";
};

export function EventSocialAccessList({ events }: { events: EventRow[] }) {
  const t = useTranslations("adminPage");
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return events;
    return events.filter(
      (e) =>
        e.title.toLowerCase().includes(q) ||
        e.organizerName.toLowerCase().includes(q) ||
        e.organizerEmail.toLowerCase().includes(q)
    );
  }, [events, query]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchEventsPlaceholder")}
        className="mb-3 w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
      />
      {filtered.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("noEvents")}</p>
      ) : (
        <div className="space-y-2">
          {filtered.map((event) => (
            <div
              key={event.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
            >
              <div>
                <p className="font-medium text-ink">{event.title}</p>
                <p className="text-xs text-ink-muted">
                  {event.organizerName} · {event.organizerEmail} ·{" "}
                  {event.accountType === "PLANNER" ? t("plannerShort") : t("individualShort")}
                </p>
                <p
                  className={`mt-1 text-xs font-medium ${event.socialToken ? "text-success" : "text-ink-light"}`}
                >
                  {event.socialToken ? t("active") : t("inactive")}
                </p>
              </div>
              <form action={toggleSocialWall.bind(null, event.id)}>
                <input type="hidden" name="enable" value={event.socialToken ? "false" : "true"} />
                <button
                  type="submit"
                  className={
                    event.socialToken
                      ? "rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-xs font-medium text-danger hover:bg-danger-bg/80"
                      : "rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-xs font-medium text-white hover:shadow-lg"
                  }
                >
                  {event.socialToken ? t("deactivate") : t("activate")}
                </button>
              </form>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
