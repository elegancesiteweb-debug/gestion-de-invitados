import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PrintButton } from "@/components/PrintButton";
import { formatDate } from "@/lib/dates";

export default async function PrintProposalPage({
  params,
}: {
  params: Promise<{ leadId: string; proposalId: string }>;
}) {
  const { leadId, proposalId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  const t = await getTranslations("proposalPrint");

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, leadId, lead: { organizerId: session.user.id } },
    include: { lead: { include: { organizer: true } }, items: { orderBy: { createdAt: "asc" } } },
  });

  if (!proposal) {
    notFound();
  }

  const total = proposal.items.reduce((sum, item) => sum + item.amount, 0);
  const { lead } = proposal;
  const { organizer } = lead;

  const clientDetails: { label: string; value: string }[] = [
    { label: t("client"), value: lead.name },
    ...(lead.partnerName ? [{ label: t("partner"), value: lead.partnerName }] : []),
    ...(lead.eventType ? [{ label: t("eventType"), value: lead.eventType }] : []),
    ...(lead.tentativeDate ? [{ label: t("tentativeDate"), value: formatDate(lead.tentativeDate) }] : []),
    ...(lead.location ? [{ label: t("location"), value: lead.location }] : []),
    ...(lead.phone ? [{ label: t("phone"), value: lead.phone }] : []),
    ...(lead.email ? [{ label: t("email"), value: lead.email }] : []),
    ...(lead.estimatedBudget != null
      ? [
          {
            label: t("estimatedBudget"),
            value: lead.estimatedBudget.toLocaleString("es-MX", { style: "currency", currency: "MXN" }),
          },
        ]
      : []),
  ];

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/dashboard/leads/${leadId}`} className="text-sm text-gold-dark hover:underline">
          {t("backToLead")}
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 flex items-start justify-between gap-4 border-b border-gold/20 pb-4">
        <div>
          {organizer.brandLogoType && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={`/api/organizers/${organizer.id}/brand-logo`}
              alt=""
              className="mb-2 h-14 w-14 rounded-lg object-cover"
            />
          )}
          <p className="font-serif text-lg font-medium text-ink">{organizer.brandName || organizer.name}</p>
          {organizer.businessPhone && <p className="text-xs text-ink-muted">{organizer.businessPhone}</p>}
          {organizer.businessEmail && <p className="text-xs text-ink-muted">{organizer.businessEmail}</p>}
        </div>
        <p className="text-xs text-ink-light">{formatDate(new Date())}</p>
      </header>

      <div className="mb-6 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{proposal.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">{t("proposalFor", { name: lead.name })}</p>
        {proposal.notes && <p className="mt-2 text-sm text-ink-muted">{proposal.notes}</p>}
      </div>

      <section className="mb-6 rounded-lg border border-gold/15 bg-warm/40 p-4">
        <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">{t("clientData")}</p>
        <dl className="grid grid-cols-1 gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
          {clientDetails.map((detail) => (
            <div key={detail.label} className="flex justify-between gap-2 sm:justify-start">
              <dt className="text-ink-muted">{detail.label}:</dt>
              <dd className="font-medium text-ink">{detail.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink/20 text-left text-xs uppercase text-ink-muted">
            <th className="py-2 pr-2">{t("description")}</th>
            <th className="py-2 text-right">{t("amount")}</th>
          </tr>
        </thead>
        <tbody>
          {proposal.items.map((item) => (
            <tr key={item.id} className="border-b border-ink/10">
              <td className="py-2 pr-2">{item.description}</td>
              <td className="py-2 text-right">
                {item.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td className="py-3 text-right font-medium">{t("total")}</td>
            <td className="py-3 text-right font-medium">
              {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            </td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}
