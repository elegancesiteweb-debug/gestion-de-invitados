import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createAccessCode, renewPlannerAccess } from "@/lib/actions/admin";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { formatDate } from "@/lib/dates";
import { daysUntil } from "@/lib/accessExpiry";

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ created?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!session.user.isAdmin) {
    notFound();
  }
  const t = await getTranslations("adminPage");

  const { created } = await searchParams;

  const codes = await prisma.accessCode.findMany({
    orderBy: { createdAt: "desc" },
    include: { usedByOrganizer: { select: { name: true, email: true } } },
  });

  const planners = await prisma.organizer.findMany({
    where: { accountType: "PLANNER" },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, email: true, accessExpiresAt: true },
  });

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const landingUrl = `${baseUrl}/landing`;

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        {t("backToEvents")}
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">{t("title")}</h1>

      <section className="mt-4 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("siteUrlTitle")}</h2>
        <p className="mt-1 text-xs text-ink-muted">{t("siteUrlHint")}</p>
        <div className="mt-3 flex flex-wrap items-center gap-3">
          <code className="rounded-lg border border-gold/25 bg-white px-3 py-1.5 text-sm text-ink">
            {landingUrl}
          </code>
          <CopyLinkButton url={landingUrl} />
          <a
            href={landingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm text-gold-dark hover:underline"
          >
            {t("openSite")}
          </a>
        </div>
      </section>

      {created && (
        <div className="mt-4 flex items-center justify-between rounded-lg border border-success/30 bg-success-bg p-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-success">{t("codeCreated")}</p>
            <p className="font-serif text-xl font-medium text-ink">{created}</p>
          </div>
          <CopyLinkButton url={created} label={t("copyCode")} />
        </div>
      )}

      <section className="mt-6 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("generateNewCode")}</h2>
        <form action={createAccessCode} className="mt-3 flex flex-wrap items-end gap-3">
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("planType")}
            </label>
            <select
              name="accountType"
              className="rounded-lg border border-gold/25 px-3 py-2 text-sm"
            >
              <option value="INDIVIDUAL">{t("individual")}</option>
              <option value="PLANNER">{t("planner")}</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("duration")}
            </label>
            <select
              name="durationMonths"
              className="rounded-lg border border-gold/25 px-3 py-2 text-sm"
            >
              <option value="">{t("durationNone")}</option>
              <option value="1">{t("duration1Month")}</option>
              <option value="12">{t("duration1Year")}</option>
            </select>
            <p className="mt-1 text-[11px] text-ink-light">{t("durationHint")}</p>
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-xs font-medium uppercase tracking-wide text-ink-muted">
              {t("label")}
            </label>
            <input
              name="label"
              placeholder={t("labelPlaceholder")}
              className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white shadow-md shadow-gold/30 hover:shadow-lg"
          >
            {t("generate")}
          </button>
        </form>
      </section>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("plannersTitle", { count: planners.length })}
        </h2>
        {planners.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noPlanners")}</p>
        ) : (
          <div className="space-y-2">
            {planners.map((p) => {
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
          {t("generatedCodes", { count: codes.length })}
        </h2>
        <div className="overflow-x-auto rounded-lg border border-gold/20 bg-white/60 shadow-md backdrop-blur-xl">
          <table className="w-full text-sm">
            <thead className="bg-warm text-left text-xs uppercase text-ink-muted">
              <tr>
                <th className="px-4 py-2">{t("code")}</th>
                <th className="px-4 py-2">{t("type")}</th>
                <th className="px-4 py-2">{t("labelColumn")}</th>
                <th className="px-4 py-2">{t("status")}</th>
              </tr>
            </thead>
            <tbody>
              {codes.map((c) => (
                <tr key={c.id} className="border-t border-gold/15">
                  <td className="px-4 py-2 font-mono">{c.code}</td>
                  <td className="px-4 py-2 text-ink-muted">
                    {c.accountType === "PLANNER" ? t("plannerShort") : t("individualShort")}
                  </td>
                  <td className="px-4 py-2 text-ink-muted">{c.label || "—"}</td>
                  <td className="px-4 py-2">
                    {c.usedAt ? (
                      <span className="text-warning">
                        {t("usedBy", {
                          name: c.usedByOrganizer?.name ?? "",
                          email: c.usedByOrganizer?.email ?? "",
                          date: formatDate(c.usedAt, "medium"),
                        })}
                      </span>
                    ) : (
                      <span className="text-success">{t("unused")}</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
