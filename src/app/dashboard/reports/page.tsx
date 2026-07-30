import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { StatCard } from "@/components/event-dashboard/StatCard";
import { formatDate } from "@/lib/dates";

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUOTED: "Cotizado",
  WON: "Ganado",
  LOST: "Perdido",
};

const MONTH_LABELS = [
  "ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic",
];

export default async function ReportsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "business_reports")) {
    notFound();
  }

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
  const sortedMonths = [...revenueByMonth.entries()].sort(([a], [b]) => a.localeCompare(b)).slice(-6);
  const maxRevenue = Math.max(1, ...sortedMonths.map(([, amount]) => amount));

  const stageCounts: Record<string, number> = { NEW: 0, CONTACTED: 0, QUOTED: 0, WON: 0, LOST: 0 };
  for (const lead of leads) {
    stageCounts[lead.stage] = (stageCounts[lead.stage] ?? 0) + 1;
  }
  const won = stageCounts.WON ?? 0;
  const lost = stageCounts.LOST ?? 0;
  const conversionRate = won + lost > 0 ? Math.round((won / (won + lost)) * 100) : null;

  const totalRevenue = paidInvoices.reduce((sum, invoice) => sum + invoice.amount, 0);

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        ← Tus eventos
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">Reportes</h1>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <StatCard
          label="Ingresos totales"
          value={totalRevenue.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
        />
        <StatCard label="Leads" value={leads.length} />
        <StatCard label="Ganados" value={won} />
        <StatCard label="Tasa de conversión" value={conversionRate !== null ? `${conversionRate}%` : "—"} />
      </div>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Ingresos por mes</h2>
        {sortedMonths.length === 0 ? (
          <p className="text-sm text-ink-muted">Todavía no hay facturas pagadas.</p>
        ) : (
          <div className="space-y-2 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl">
            {sortedMonths.map(([key, amount]) => {
              const [year, month] = key.split("-");
              const label = `${MONTH_LABELS[parseInt(month, 10) - 1]} ${year}`;
              const widthPct = Math.round((amount / maxRevenue) * 100);
              return (
                <div key={key} className="flex items-center gap-3 text-sm">
                  <span className="w-16 flex-none text-ink-muted">{label}</span>
                  <div className="h-3 flex-1 overflow-hidden rounded-full bg-warm">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-gold-dark to-gold-deep"
                      style={{ width: `${widthPct}%` }}
                    />
                  </div>
                  <span className="w-24 flex-none text-right text-ink">
                    {amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Leads por etapa</h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
          {Object.entries(STAGE_LABELS).map(([stage, label]) => (
            <div
              key={stage}
              className="rounded-lg border border-gold/20 bg-white/60 p-3 text-center shadow-sm backdrop-blur-xl"
            >
              <p className="font-serif text-xl font-medium text-ink">{stageCounts[stage] ?? 0}</p>
              <p className="text-xs text-ink-muted">{label}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">Próximos pagos pendientes</h2>
        {pendingInvoices.length === 0 ? (
          <p className="text-sm text-ink-muted">No hay facturas pendientes.</p>
        ) : (
          <div className="space-y-2">
            {pendingInvoices.slice(0, 10).map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {invoice.description} · {invoice.leadName}
                  </p>
                  <p className="text-xs text-ink-muted">
                    {invoice.amount.toLocaleString("es-MX", { style: "currency", currency: invoice.currency })}
                    {invoice.dueDate ? ` · Vence ${formatDate(invoice.dueDate)}` : ""}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
