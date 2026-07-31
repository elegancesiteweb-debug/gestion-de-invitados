import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { createLead, importLeadsCsv } from "@/lib/actions/leads";

export default async function LeadsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "crm_leads")) {
    notFound();
  }
  const t = await getTranslations("leadsPage");

  const STAGE_LABELS: Record<string, string> = {
    NEW: t("stageNew"),
    CONTACTED: t("stageContacted"),
    QUOTED: t("stageQuoted"),
    WON: t("stageWon"),
    LOST: t("stageLost"),
  };

  const STAGE_STYLES: Record<string, string> = {
    NEW: "bg-warm text-ink-muted",
    CONTACTED: "bg-gold/15 text-gold-dark",
    QUOTED: "bg-blue-100 text-blue-700",
    WON: "bg-success-bg text-success",
    LOST: "bg-danger-bg text-danger",
  };

  const leads = await prisma.lead.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        {t("backToEvents")}
      </Link>

      <div className="mt-2 flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-serif text-2xl font-medium text-ink">{t("title")}</h1>
        <div className="flex gap-4">
          {hasFeature(session.user.accountType, "crm_packages") && (
            <Link href="/dashboard/packages" className="text-sm text-gold-dark hover:underline">
              {t("packages")}
            </Link>
          )}
          {hasFeature(session.user.accountType, "crm_contracts") && (
            <Link href="/dashboard/contract-templates" className="text-sm text-gold-dark hover:underline">
              {t("contractTemplates")}
            </Link>
          )}
          <Link href="/dashboard/leads/questions" className="text-sm text-gold-dark hover:underline">
            {t("intakeQuestionnaire")}
          </Link>
        </div>
      </div>
      <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>

      <section className="mt-6">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("addLead")}</h2>
        <form
          action={createLead}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("phone")}</label>
            <input name="phone" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("email")}</label>
            <input name="email" type="email" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
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
        <form
          action={importLeadsCsv}
          className="mt-3 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
        >
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("importCsv")}</label>
            <input type="file" name="file" accept=".csv" required className="text-sm" />
            <p className="mt-1 text-xs text-ink-muted">{t("csvColumns")}</p>
          </div>
          <button
            type="submit"
            className="rounded-lg border border-gold/25 px-4 py-1.5 text-sm font-medium hover:bg-warm"
          >
            {t("import")}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("yourLeads", { count: leads.length })}
        </h2>
        {leads.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noLeads")}</p>
        ) : (
          <div className="space-y-2">
            {leads.map((lead) => (
              <Link
                key={lead.id}
                href={`/dashboard/leads/${lead.id}`}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl transition hover:border-gold/40 hover:shadow-md"
              >
                <div>
                  <p className="font-medium text-ink">
                    {lead.name}
                    {lead.convertedEventId && (
                      <span className="ml-2 rounded-full bg-success-bg px-2 py-0.5 text-xs text-success">
                        {t("convertedToEvent")}
                      </span>
                    )}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {lead.phone || ""} {lead.email ? `· ${lead.email}` : ""}
                  </p>
                </div>
                <span
                  className={`flex-none rounded-full px-2.5 py-1 text-xs font-medium ${STAGE_STYLES[lead.stage]}`}
                >
                  {STAGE_LABELS[lead.stage]}
                </span>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
