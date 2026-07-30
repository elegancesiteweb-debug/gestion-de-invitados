import Link from "next/link";
import { notFound, redirect } from "next/navigation";
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

  const proposal = await prisma.proposal.findFirst({
    where: { id: proposalId, leadId, lead: { organizerId: session.user.id } },
    include: { lead: true, items: { orderBy: { createdAt: "asc" } } },
  });

  if (!proposal) {
    notFound();
  }

  const total = proposal.items.reduce((sum, item) => sum + item.amount, 0);

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 print:px-0 print:py-0">
      <div className="mb-6 flex items-center justify-between print:hidden">
        <Link href={`/dashboard/leads/${leadId}`} className="text-sm text-gold-dark hover:underline">
          ← Volver al lead
        </Link>
        <PrintButton />
      </div>

      <header className="mb-6 border-b border-gold/20 pb-4 text-center">
        <h1 className="font-serif text-2xl font-medium text-ink">{proposal.title}</h1>
        <p className="mt-1 text-sm text-ink-muted">Propuesta para {proposal.lead.name}</p>
        {proposal.notes && <p className="mt-2 text-sm text-ink-muted">{proposal.notes}</p>}
      </header>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-ink/20 text-left text-xs uppercase text-ink-muted">
            <th className="py-2 pr-2">Descripción</th>
            <th className="py-2 text-right">Monto</th>
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
            <td className="py-3 text-right font-medium">Total</td>
            <td className="py-3 text-right font-medium">
              {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
            </td>
          </tr>
        </tfoot>
      </table>

      <p className="mt-6 text-center text-xs text-ink-light">
        Generado el {formatDate(new Date())}
      </p>
    </div>
  );
}
