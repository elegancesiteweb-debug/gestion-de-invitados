"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { renewPlannerAccess, impersonateOrganizer } from "@/lib/actions/admin";
import { formatDate } from "@/lib/dates";
import { daysUntil } from "@/lib/accessExpiry";

type Planner = { id: string; name: string; email: string; accessExpiresAt: Date | null };
type Individual = {
  id: string;
  name: string;
  email: string;
  loginCode: string | null;
  events: { title: string }[];
};

export function AdminOrganizersSearch({
  planners,
  individuals,
}: {
  planners: Planner[];
  individuals: Individual[];
}) {
  const t = useTranslations("adminPage");
  const [query, setQuery] = useState("");

  const q = query.trim().toLowerCase();

  const filteredPlanners = useMemo(() => {
    if (!q) return planners;
    return planners.filter(
      (p) => p.name.toLowerCase().includes(q) || p.email.toLowerCase().includes(q)
    );
  }, [planners, q]);

  const filteredIndividuals = useMemo(() => {
    if (!q) return individuals;
    return individuals.filter(
      (org) =>
        org.name.toLowerCase().includes(q) ||
        org.email.toLowerCase().includes(q) ||
        (org.loginCode ?? "").toLowerCase().includes(q) ||
        org.events.some((e) => e.title.toLowerCase().includes(q))
    );
  }, [individuals, q]);

  return (
    <div>
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder={t("searchOrganizersPlaceholder")}
        className="mb-4 w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
      />

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("plannersTitle", { count: filteredPlanners.length })}
        </h2>
        {filteredPlanners.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {q ? t("noSearchResults") : t("noPlanners")}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredPlanners.map((p) => {
              const remaining = p.accessExpiresAt ? daysUntil(p.accessExpiresAt) : null;
              return (
                <div
                  key={p.id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
                >
                  <div>
                    <p className="font-medium text-ink">{p.name}</p>
                    <p className="text-xs text-ink-muted">{p.email}</p>
                    {p.accessExpiresAt == null ? (
                      <p className="mt-1 text-xs text-ink-light">{t("noExpiry")}</p>
                    ) : remaining !== null && remaining < 0 ? (
                      <p className="mt-1 text-xs font-medium text-danger">
                        {t("expiredDaysAgo", { days: Math.abs(remaining) })}
                      </p>
                    ) : (
                      <p className="mt-1 text-xs text-ink-muted">
                        {t("expiresOn", { date: formatDate(p.accessExpiresAt, "medium") })} ·{" "}
                        {t("daysRemaining", { days: remaining ?? 0 })}
                      </p>
                    )}
                  </div>
                  <form
                    action={renewPlannerAccess.bind(null, p.id)}
                    className="flex flex-none items-center gap-2"
                  >
                    <select
                      name="durationMonths"
                      className="rounded-lg border border-gold/25 px-2 py-1.5 text-xs"
                    >
                      <option value="1">{t("duration1Month")}</option>
                      <option value="12">{t("duration1Year")}</option>
                    </select>
                    <button
                      type="submit"
                      className="rounded-lg border border-gold/25 px-3 py-1.5 text-xs font-medium hover:bg-warm"
                    >
                      {t("renew")}
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("individualsTitle", { count: filteredIndividuals.length })}
        </h2>
        <p className="mb-3 text-xs text-ink-muted">{t("individualsHint")}</p>
        {filteredIndividuals.length === 0 ? (
          <p className="text-sm text-ink-muted">
            {q ? t("noSearchResults") : t("noIndividuals")}
          </p>
        ) : (
          <div className="space-y-2">
            {filteredIndividuals.map((org) => (
              <div
                key={org.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">{org.name}</p>
                  {org.loginCode ? (
                    <p className="text-xs text-ink-muted">
                      {t("loginCodeLabel")} <span className="font-mono">{org.loginCode}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-ink-muted">{org.email}</p>
                  )}
                  <p className="mt-1 text-xs text-ink-light">
                    {org.events.length > 0
                      ? org.events.map((e) => e.title).join(", ")
                      : t("noEventYet")}
                  </p>
                </div>
                <form action={impersonateOrganizer.bind(null, org.id)}>
                  <button
                    type="submit"
                    className="rounded-lg border border-gold/25 px-3 py-1.5 text-xs font-medium hover:bg-warm"
                  >
                    {t("enterAs")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
