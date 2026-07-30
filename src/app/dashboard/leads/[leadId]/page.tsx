import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { updateLead, updateLeadStage, deleteLead } from "@/lib/actions/leads";
import { createProposal, deleteProposal, addProposalItem, deleteProposalItem } from "@/lib/actions/proposals";
import { createContract, deleteContract } from "@/lib/actions/contracts";
import { createInvoice, createPaymentPlan, deleteInvoice, sendInvoiceReminder } from "@/lib/actions/invoices";
import { PROVIDER_LABELS } from "@/lib/payments";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { formatDateTime } from "@/lib/dates";

const STAGE_LABELS: Record<string, string> = {
  NEW: "Nuevo",
  CONTACTED: "Contactado",
  QUOTED: "Cotizado",
  WON: "Ganado",
  LOST: "Perdido",
};

export default async function LeadDetailPage({
  params,
}: {
  params: Promise<{ leadId: string }>;
}) {
  const { leadId } = await params;
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "crm_leads")) {
    notFound();
  }

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizerId: session.user.id },
    include: {
      proposals: { orderBy: { createdAt: "asc" }, include: { items: true } },
      contracts: { orderBy: { createdAt: "asc" } },
      invoices: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!lead) {
    notFound();
  }

  const baseUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";
  const showProposals = hasFeature(session.user.accountType, "crm_proposals");
  const showContracts = hasFeature(session.user.accountType, "crm_contracts");
  const showInvoices = hasFeature(session.user.accountType, "crm_invoicing");

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard/leads" className="text-sm text-gold-dark hover:underline">
        ← Leads
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-serif text-2xl font-medium text-ink">{lead.name}</h1>
        <form action={deleteLead.bind(null, lead.id)}>
          <button type="submit" className="text-sm text-danger hover:underline">
            Eliminar lead
          </button>
        </form>
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <form
          action={updateLead.bind(null, lead.id)}
          className="space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <p className="font-medium text-ink">Datos de contacto</p>
          <div>
            <label className="block text-xs font-medium mb-1">Nombre</label>
            <input
              name="name"
              defaultValue={lead.name}
              required
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Teléfono</label>
            <input
              name="phone"
              defaultValue={lead.phone ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Email</label>
            <input
              name="email"
              type="email"
              defaultValue={lead.email ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">Notas</label>
            <textarea
              name="notes"
              defaultValue={lead.notes ?? ""}
              rows={2}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            Guardar
          </button>
        </form>

        <div className="space-y-4">
          <form
            action={updateLeadStage.bind(null, lead.id)}
            className="space-y-2 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <p className="font-medium text-ink">Etapa</p>
            <select
              name="stage"
              defaultValue={lead.stage}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            >
              {Object.entries(STAGE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            <button
              type="submit"
              className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
            >
              Actualizar etapa
            </button>
          </form>

          <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
            <p className="font-medium text-ink">Evento</p>
            {lead.convertedEventId ? (
              <Link
                href={`/dashboard/events/${lead.convertedEventId}`}
                className="mt-2 inline-block text-sm text-gold-dark hover:underline"
              >
                Ver evento convertido →
              </Link>
            ) : (
              <Link
                href={`/dashboard/events/new?leadId=${lead.id}&title=${encodeURIComponent(lead.name)}`}
                className="mt-2 inline-block rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm font-medium text-white hover:shadow-lg"
              >
                Convertir en evento
              </Link>
            )}
          </div>
        </div>
      </section>

      {Array.isArray(lead.intakeAnswers) && lead.intakeAnswers.length > 0 && (
        <section className="mt-4 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <p className="font-medium text-ink">Respuestas del cuestionario</p>
          <dl className="mt-2 space-y-2">
            {(lead.intakeAnswers as unknown as { questionId: string; label: string; value: string }[]).map(
              (answer) => (
                <div key={answer.questionId}>
                  <dt className="text-xs font-medium text-ink-muted">{answer.label}</dt>
                  <dd className="text-sm text-ink">{answer.value}</dd>
                </div>
              )
            )}
          </dl>
        </section>
      )}

      {showProposals && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">Propuestas</h2>
          <form
            action={createProposal.bind(null, lead.id)}
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Título</label>
              <input name="title" required className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Notas</label>
              <input name="notes" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Crear propuesta
            </button>
          </form>

          <div className="space-y-4">
            {lead.proposals.map((proposal) => {
              const total = proposal.items.reduce((sum, item) => sum + item.amount, 0);
              return (
                <div
                  key={proposal.id}
                  className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-medium text-ink">{proposal.title}</p>
                      {proposal.notes && <p className="text-xs text-ink-muted">{proposal.notes}</p>}
                    </div>
                    <div className="flex flex-none items-center gap-3">
                      <Link
                        href={`/dashboard/leads/${lead.id}/proposals/${proposal.id}/print`}
                        className="text-sm text-gold-dark hover:underline"
                      >
                        Imprimir
                      </Link>
                      <form action={deleteProposal.bind(null, lead.id, proposal.id)}>
                        <button type="submit" className="text-sm text-danger hover:underline">
                          Eliminar
                        </button>
                      </form>
                    </div>
                  </div>

                  <ul className="mt-3 space-y-1 text-sm">
                    {proposal.items.map((item) => (
                      <li key={item.id} className="flex items-center justify-between gap-2">
                        <span>{item.description}</span>
                        <span className="flex items-center gap-2">
                          <span className="text-ink-muted">
                            {item.amount.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                          </span>
                          <form action={deleteProposalItem.bind(null, lead.id, item.id)}>
                            <button type="submit" className="text-xs text-danger hover:underline">
                              quitar
                            </button>
                          </form>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-right text-sm font-medium text-ink">
                    Total: {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </p>

                  <form
                    action={addProposalItem.bind(null, lead.id, proposal.id)}
                    className="mt-3 flex flex-wrap items-end gap-2 border-t border-gold/15 pt-3"
                  >
                    <div className="flex-1">
                      <input
                        name="description"
                        required
                        placeholder="Descripción"
                        className="w-full rounded-lg border border-gold/25 px-2 py-1 text-sm"
                      />
                    </div>
                    <div className="w-28">
                      <input
                        name="amount"
                        type="number"
                        step="0.01"
                        min="0"
                        required
                        placeholder="Monto"
                        className="w-full rounded-lg border border-gold/25 px-2 py-1 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg border border-gold/25 px-3 py-1 text-sm hover:bg-warm"
                    >
                      + Ítem
                    </button>
                  </form>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showContracts && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">Contratos</h2>
          <form
            action={createContract.bind(null, lead.id)}
            className="mb-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div>
              <label className="block text-xs font-medium mb-1">Título</label>
              <input name="title" required className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Contenido</label>
              <textarea
                name="content"
                required
                rows={4}
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Crear contrato
            </button>
          </form>

          <div className="space-y-2">
            {lead.contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">{contract.title}</p>
                  <p className="text-xs text-ink-muted">
                    {contract.signedAt
                      ? `Firmado el ${formatDateTime(contract.signedAt)} por ${contract.signerName}`
                      : "Pendiente de firma"}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <CopyLinkButton url={`${baseUrl}/sign/${contract.token}`} label="Copiar link de firma" />
                  <form action={deleteContract.bind(null, lead.id, contract.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {showInvoices && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">Facturas</h2>
          <form
            action={createInvoice.bind(null, lead.id)}
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Descripción</label>
              <input
                name="description"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium mb-1">Monto</label>
              <input
                name="amount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium mb-1">Moneda</label>
              <input
                name="currency"
                defaultValue="mxn"
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pasarela</label>
              <select
                name="provider"
                className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              >
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              Crear factura
            </button>
          </form>

          <form
            action={createPaymentPlan.bind(null, lead.id)}
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <p className="w-full text-sm font-medium text-ink">Crear plan de pagos</p>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">Descripción</label>
              <input
                name="description"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium mb-1">Monto total</label>
              <input
                name="totalAmount"
                type="number"
                step="0.01"
                min="0"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-24">
              <label className="block text-xs font-medium mb-1">Cuotas</label>
              <select name="installments" defaultValue="2" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">1ra cuota</label>
              <input
                name="firstDueDate"
                type="date"
                className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium mb-1">Moneda</label>
              <input
                name="currency"
                defaultValue="mxn"
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">Pasarela</label>
              <select name="provider" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm">
                {Object.entries(PROVIDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>
                    {label}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="submit"
              className="rounded-lg border border-gold/25 px-4 py-1.5 text-sm font-medium hover:bg-warm"
            >
              Crear plan
            </button>
          </form>

          <div className="space-y-2">
            {lead.invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">
                    {invoice.label && (
                      <span className="mr-2 rounded-full bg-warm px-2 py-0.5 text-xs text-ink-muted">
                        {invoice.label}
                      </span>
                    )}
                    {invoice.description}{" "}
                    <span className="text-ink-muted">
                      ·{" "}
                      {invoice.amount.toLocaleString("es-MX", {
                        style: "currency",
                        currency: invoice.currency,
                      })}
                    </span>
                  </p>
                  <p className="text-xs text-ink-muted">
                    {PROVIDER_LABELS[invoice.provider]} ·{" "}
                    {invoice.status === "paid"
                      ? `Pagada${invoice.paidAt ? ` el ${formatDateTime(invoice.paidAt)}` : ""}`
                      : invoice.dueDate
                        ? `Vence el ${formatDateTime(invoice.dueDate)}`
                        : "Pendiente de pago"}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <CopyLinkButton url={`${baseUrl}/pay/${invoice.token}`} label="Copiar link de pago" />
                  {invoice.status !== "paid" && lead.email && (
                    <form action={sendInvoiceReminder.bind(null, lead.id, invoice.id)}>
                      <button type="submit" className="text-sm text-gold-dark hover:underline">
                        Enviar recordatorio
                      </button>
                    </form>
                  )}
                  <form action={deleteInvoice.bind(null, lead.id, invoice.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      Eliminar
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
