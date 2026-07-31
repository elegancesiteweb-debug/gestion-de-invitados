import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";

export default async function PrintReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "business_reports")) {
    notFound();
  }
  const t = await getTranslations("reportsPrint");
  const MONTH_LABELS = t.raw("monthLabels") as string[];

  const STAGE_LABELS: Record<string, string> = {
    NEW: t("stageNew"),
    CONTACTED: t("stageContacted"),
    QUOTED: t("stageQuoted"),
    WON: t("stageWon"),
    LOST: t("stageLost"),
  };

  const leads = await prisma.lead.findMany({
    where: { organizerId: session.user.id },
    include: { invoices: true },
  });

  const allInvoices = leads.flatMap((lead) => lead.invoices.map((invoice) => ({ ...invoice, leadName: lead.name })));
  const paidInvoices = allInvoices.filter((invoice) => invoice.status === "paid" && invoice.paidAt);
  const pendingInvoices = allInvoices
    .filter((invoice) => invoice.status !== "paid")
    .sort((a, b) => {
      if (!a.dueDate && !b.dueDate) return 0;
      if (!a.dueDate) return 1;
      if (!b.dueDate) return -1;
      return a.dueDate.getTime() - b.dueDate.getTime();
    });

  const revenueByMonth = new Map<string, number>();
  for (const invoice of paidInvoices) {
    const date = invoice.paidAt as Date;
    const key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
    revenueByMonth.set(key, (revenueByMonth.get(key) ?? 0) + invoice.amount);
  }
  const sortedMonths = [...revenueByMonth.entries()].sort(([a], [b]) => a.localeCompare(b));

  const stageCounts: Record<string, number> = { NEW: 0, CONTACTED: 0, QUOTED: 0, WON: 0, LOST: 0 };
  for (const lead of leads) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
  }
  const won = stageCounts.WON ?? 0;
  const lost = stageCounts.LOST ?? 0;
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;
  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href="/dashboard/reports" className="text-sm text-gold-dark hover:underline">
          {t("backToReports")}
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{t("title")}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("generatedOn", { date: formatDate(new Date()) })}</p>
      </header>

      <div className="mb-6 grid grid-cols-4 gap-3 text-center">
        <div>
          <p className="font-serif text-2xl font-medium text-ink">
            {totalRevenue.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
          </p>
          <p className="text-xs text-ink-muted">{t("totalRevenue")}</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-ink">{leads.length}</p>
          <p className="text-xs text-ink-muted">{t("leads")}</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-success">{won}</p>
          <p className="text-xs text-ink-muted">{t("won")}</p>
        </div>
        <div>
          <p className="font-serif text-2xl font-medium text-ink">
            {conversionRate !== null ? `${conversionRate}%` : "—"}
          </p>
          <p className="text-xs text-ink-muted">{t("conversion")}</p>
        </div>
      </div>

      <section className="mb-6">
        <h2 className="mb-2 font-serif text-lg font-medium text-ink">{t("revenueByMonth")}</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/20 text-left text-xs uppercase text-ink-muted">
              <th className="py-1">{t("month")}</th>
              <th className="py-1 text-right">{t("amount")}</th>
            </tr>
          </thead>
          <tbody>
            {sortedMonths.map(([key, amount]) => {
              const [year, month] = key.split("-");
              return (
                <tr key={key} className="border-b border-ink/10">
                  <td className="py-1">{MONTH_LABELS[parseInt(month, 10) - 1]} {year}</td>
                  <td className="py-1 text-right">
                    {amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </section>

      <section className="mb-6">
        <h2 className="mb-2 font-serif text-lg font-medium text-ink">{t("leadsByStage")}</h2>
        <table className="w-full border-collapse text-sm">
          <tbody>
            {Object.entries(STAGE_LABELS).map(([stage, label]) => (
              <tr key={stage} className="border-b border-ink/10">
                <td className="py-1">{label}</td>
                <td className="py-1 text-right">{stageCounts[stage] ?? 0}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2 className="mb-2 font-serif text-lg font-medium text-ink">{t("pendingPayments")}</h2>
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-ink/20 text-left text-xs uppercase text-ink-muted">
              <th className="py-1">{t("description")}</th>
              <th className="py-1">{t("lead")}</th>
              <th className="py-1 text-right">{t("amount")}</th>
              <th className="py-1 text-right">{t("due")}</th>
            </tr>
          </thead>
          <tbody>
            {pendingInvoices.map((invoice) => (
              <tr key={invoice.id} className="border-b border-ink/10">
                <td className="py-1">{invoice.description}</td>
                <td className="py-1">{invoice.leadName}</td>
                <td className="py-1 text-right">
                  {invoice.amount.toLocaleString("es-MX", { style: "currency", currency: invoice.currency })}
                </td>
                <td className="py-1 text-right">{invoice.dueDate ? formatDate(invoice.dueDate) : "—"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
}
