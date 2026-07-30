import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getGateway } from "@/lib/payments";

export default async function PaySuccessPage({
  params,
  searchParams,
}: {
  params: Promise<{ token: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const { token } = await params;
  const rawSearchParams = await searchParams;

  const invoice = await prisma.invoice.findUnique({ where: { token } });
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
    const result = await gateway.verifyPayment({
      providerSessionId: invoice.providerSessionId,
      searchParams: searchParamsRecord,
    });

    if (result.paid && (!result.invoiceToken || result.invoiceToken === invoice.token)) {
      await prisma.invoice.update({
        where: { token },
        data: { status: "paid", paidAt: new Date() },
      });
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
            <p className="mt-2 font-serif text-xl font-medium text-success">¡Pago recibido!</p>
            <p className="mt-1 text-sm text-ink-muted">Gracias, tu pago fue confirmado.</p>
          </>
        ) : (
          <>
            <p className="font-serif text-xl font-medium text-danger">No se pudo confirmar el pago</p>
            <p className="mt-1 text-sm text-ink-muted">
              Si ya pagaste, espera un momento y recarga esta página.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
