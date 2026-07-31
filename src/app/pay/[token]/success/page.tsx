import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getGateway, resolvePaymentCredential } from "@/lib/payments";
import { notifyOrganizer } from "@/lib/email";
import { logActivity } from "@/lib/activityLog";

export default async function PaySuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const rawSearchParams = await searchParams;
  const t = await getTranslations("payPage");

  const invoice = await prisma.invoice.findUnique({
    where: { token },
    include: { lead: { include: { organizer: true } } },
  });
  if (!invoice) {
    notFound();
  }

  if (invoice.status !== "paid") {
    const searchParamsRecord: Record<string, string> = {};
    for (const [key, value] of Object.entries(rawSearchParams)) {
      if (typeof value === "string") {
        searchParamsRecord[key] = value;
      }
    }

    const gateway = getGateway(invoice.provider);
    const apiKey = resolvePaymentCredential(invoice.lead.organizer, invoice.provider);
    const result = await gateway.verifyPayment({
      providerSessionId: invoice.providerSessionId,
      searchParams: searchParamsRecord,
      apiKey,
    });

    if (result.paid && (!result.invoiceToken || result.invoiceToken === invoice.token)) {
      await prisma.invoice.update({
        where: { token },
        data: { status: "paid", paidAt: new Date() },
      });

      await notifyOrganizer(
        invoice.lead.organizer,
        `Pago recibido: ${invoice.description}`,
        `Se recibió el pago de ${invoice.amount.toLocaleString("es-MX", {
          style: "currency",
          currency: invoice.currency,
        })} de ${invoice.lead.name} (${invoice.description}).`
      );

      if (invoice.lead.convertedEventId) {
        await logActivity(
          invoice.lead.convertedEventId,
          `Se pagó la factura "${invoice.description}"`,
          invoice.lead.name
        );
      }
    }
  }

  const finalInvoice =
    invoice.status === "paid" ? invoice : await prisma.invoice.findUnique({ where: { token } });

  const paid = finalInvoice?.status === "paid";

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 text-center shadow-lg backdrop-blur-xl">
        {paid ? (
          <>
            <p className="text-4xl">✓</p>
            <p className="mt-2 font-serif text-xl font-medium text-success">{t("paymentReceived")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("paymentConfirmed")}</p>
          </>
        ) : (
          <>
            <p className="font-serif text-xl font-medium text-danger">{t("couldNotConfirm")}</p>
            <p className="mt-1 text-sm text-ink-muted">{t("ifAlreadyPaid")}</p>
          </>
        )}
      </div>
    </div>
  );
}
