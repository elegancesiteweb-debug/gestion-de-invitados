import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { createCheckoutSession } from "@/lib/actions/invoices";
import { PROVIDER_LABELS } from "@/lib/payments";

export default async function PayInvoicePage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("payPage");

  const invoice = await prisma.invoice.findUnique({ where: { token } });
  if (!invoice) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 text-center shadow-lg backdrop-blur-xl">
        <p className="text-xs uppercase tracking-[0.2em] text-gold-dark">{t("invoice")}</p>
        <p className="mt-2 font-serif text-2xl font-medium text-ink">{invoice.description}</p>
        <p className="mt-2 font-serif text-3xl font-medium text-ink">
          {invoice.amount.toLocaleString("es-MX", { style: "currency", currency: invoice.currency })}
        </p>

        {invoice.status === "paid" ? (
          <div className="mt-6 rounded-lg border border-success/30 bg-success-bg p-4 text-sm text-success">
            {t("alreadyPaid")}
          </div>
        ) : (
          <form action={createCheckoutSession.bind(null, token)} className="mt-6">
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2.5 text-sm font-medium text-white shadow-md shadow-gold/30 hover:shadow-lg"
            >
              {t("payWith", { provider: PROVIDER_LABELS[invoice.provider] })}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
