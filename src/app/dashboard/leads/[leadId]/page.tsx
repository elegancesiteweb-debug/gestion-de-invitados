import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { updateLead, updateLeadStage, deleteLead } from "@/lib/actions/leads";
import {
  createProposal,
  deleteProposal,
  addProposalItem,
  deleteProposalItem,
  uploadProposalImage,
  deleteProposalImage,
  replyToProposalComment,
} from "@/lib/actions/proposals";
import { createContract, deleteContract } from "@/lib/actions/contracts";
import { ContractTemplatePicker } from "@/components/event-dashboard/ContractTemplatePicker";
import { createInvoice, createPaymentPlan, deleteInvoice, sendInvoiceReminder } from "@/lib/actions/invoices";
import { addPackageToProposal } from "@/lib/actions/packages";
import { PROVIDER_LABELS } from "@/lib/payments";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { ImageLightbox } from "@/components/ImageLightbox";
import { formatDateTime } from "@/lib/dates";

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
  const t = await getTranslations("leadDetail");

  const STAGE_LABELS: Record<string, string> = {
    NEW: t("stageNew"),
    CONTACTED: t("stageContacted"),
    QUOTED: t("stageQuoted"),
    WON: t("stageWon"),
    LOST: t("stageLost"),
  };

  const lead = await prisma.lead.findFirst({
    where: { id: leadId, organizerId: session.user.id },
    include: {
      proposals: {
        orderBy: { createdAt: "asc" },
        include: { items: true, images: true, comments: { orderBy: { createdAt: "asc" } } },
      },
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
  const showPackages = hasFeature(session.user.accountType, "crm_packages");

  const packages = showProposals && showPackages
    ? await prisma.package.findMany({ where: { organizerId: session.user.id }, orderBy: { name: "asc" } })
    : [];
  const contractTemplates = showContracts
    ? await prisma.contractTemplate.findMany({ where: { organizerId: session.user.id }, orderBy: { name: "asc" } })
    : [];

  return (
    <div className="mx-auto w-full max-w-4xl px-4 py-10">
      <Link href="/dashboard/leads" className="text-sm text-gold-dark hover:underline">
        {t("backToLeads")}
      </Link>

      <div className="mt-4 flex flex-wrap items-start justify-between gap-3">
        <h1 className="font-serif text-2xl font-medium text-ink">{lead.name}</h1>
        <form action={deleteLead.bind(null, lead.id)}>
          <button type="submit" className="text-sm text-danger hover:underline">
            {t("deleteLead")}
          </button>
        </form>
      </div>

      <section className="mt-4 grid gap-4 sm:grid-cols-2">
        <form
          action={updateLead.bind(null, lead.id)}
          className="space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <p className="font-medium text-ink">{t("contactData")}</p>
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input
              name="name"
              defaultValue={lead.name}
              required
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("phone")}</label>
            <input
              name="phone"
              defaultValue={lead.phone ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("email")}</label>
            <input
              name="email"
              type="email"
              defaultValue={lead.email ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("notes")}</label>
            <textarea
              name="notes"
              defaultValue={lead.notes ?? ""}
              rows={2}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>

          <p className="pt-2 font-medium text-ink">{t("weddingEventData")}</p>
          <div>
            <label className="block text-xs font-medium mb-1">{t("partnerName")}</label>
            <input
              name="partnerName"
              defaultValue={lead.partnerName ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("eventType")}</label>
            <input
              name="eventType"
              defaultValue={lead.eventType ?? ""}
              placeholder={t("eventTypePlaceholder")}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("tentativeDate")}</label>
            <input
              name="tentativeDate"
              type="date"
              defaultValue={lead.tentativeDate ? lead.tentativeDate.toISOString().slice(0, 10) : ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("location")}</label>
            <input
              name="location"
              defaultValue={lead.location ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("estimatedBudget")}</label>
            <input
              name="estimatedBudget"
              type="number"
              step="0.01"
              min="0"
              defaultValue={lead.estimatedBudget ?? ""}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>

          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("save")}
          </button>
        </form>

        <div className="space-y-4">
          <form
            action={updateLeadStage.bind(null, lead.id)}
            className="space-y-2 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <p className="font-medium text-ink">{t("stage")}</p>
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
              {t("updateStage")}
            </button>
          </form>

          <div className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
            <p className="font-medium text-ink">{t("event")}</p>
            {lead.convertedEventId ? (
              <Link
                href={`/dashboard/events/${lead.convertedEventId}`}
                className="mt-2 inline-block text-sm text-gold-dark hover:underline"
              >
                {t("viewConvertedEvent")}
              </Link>
            ) : (
              <Link
                href={`/dashboard/events/new?leadId=${lead.id}&title=${encodeURIComponent(lead.name)}`}
                className="mt-2 inline-block rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm font-medium text-white hover:shadow-lg"
              >
                {t("convertToEvent")}
              </Link>
            )}
          </div>
        </div>
      </section>

      {Array.isArray(lead.intakeAnswers) && lead.intakeAnswers.length > 0 && (
        <section className="mt-4 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
          <p className="font-medium text-ink">{t("intakeAnswers")}</p>
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
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("proposals")}</h2>
          <form
            action={createProposal.bind(null, lead.id)}
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">{t("title")}</label>
              <input name="title" required className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
            </div>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">{t("notes")}</label>
              <input name="notes" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
            </div>
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              {t("createProposal")}
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
                        {t("print")}
                      </Link>
                      <form action={deleteProposal.bind(null, lead.id, proposal.id)}>
                        <button type="submit" className="text-sm text-danger hover:underline">
                          {t("delete")}
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
                              {t("remove")}
                            </button>
                          </form>
                        </span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-2 text-right text-sm font-medium text-ink">
                    {t("total")}: {total.toLocaleString("es-MX", { style: "currency", currency: "MXN" })}
                  </p>

                  <form
                    action={addProposalItem.bind(null, lead.id, proposal.id)}
                    className="mt-3 flex flex-wrap items-end gap-2 border-t border-gold/15 pt-3"
                  >
                    <div className="flex-1">
                      <input
                        name="description"
                        required
                        placeholder={t("description")}
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
                        placeholder={t("amount")}
                        className="w-full rounded-lg border border-gold/25 px-2 py-1 text-sm"
                      />
                    </div>
                    <button
                      type="submit"
                      className="rounded-lg border border-gold/25 px-3 py-1 text-sm hover:bg-warm"
                    >
                      {t("addItem")}
                    </button>
                  </form>

                  {showPackages && packages.length > 0 && (
                    <form
                      action={addPackageToProposal.bind(null, lead.id, proposal.id)}
                      className="mt-2 flex flex-wrap items-end gap-2"
                    >
                      <div className="flex-1">
                        <select
                          name="packageId"
                          required
                          className="w-full rounded-lg border border-gold/25 px-2 py-1 text-sm"
                        >
                          {packages.map((pkg) => (
                            <option key={pkg.id} value={pkg.id}>
                              {pkg.name}
                            </option>
                          ))}
                        </select>
                      </div>
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/25 px-3 py-1 text-sm hover:bg-warm"
                      >
                        {t("addPackage")}
                      </button>
                    </form>
                  )}

                  <div className="mt-4 border-t border-gold/15 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                      {t("images")}
                    </p>
                    {proposal.images.length > 0 && (
                      <div className="mb-2 grid grid-cols-3 gap-2 sm:grid-cols-4">
                        {proposal.images.map((image) => (
                          <div key={image.id} className="group relative overflow-hidden rounded-lg shadow-sm">
                            <ImageLightbox src={`/api/proposal-images/${image.id}`} alt={proposal.title}>
                              {/* eslint-disable-next-line @next/next/no-img-element */}
                              <img
                                src={`/api/proposal-images/${image.id}`}
                                alt=""
                                className="h-20 w-full object-cover"
                              />
                            </ImageLightbox>
                            <form
                              action={deleteProposalImage.bind(null, lead.id, image.id)}
                              className="absolute inset-x-0 bottom-0 bg-black/50 p-1 text-center opacity-0 transition group-hover:opacity-100"
                            >
                              <button type="submit" className="text-xs text-white hover:underline">
                                {t("delete")}
                              </button>
                            </form>
                          </div>
                        ))}
                      </div>
                    )}
                    <form
                      action={uploadProposalImage.bind(null, lead.id, proposal.id)}
                      className="flex flex-wrap items-center gap-2"
                    >
                      <input type="file" name="image" accept="image/*" required className="text-xs" />
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/25 px-3 py-1 text-xs hover:bg-warm"
                      >
                        {t("uploadImage")}
                      </button>
                    </form>
                  </div>

                  <div className="mt-4 border-t border-gold/15 pt-3">
                    <p className="mb-2 text-xs font-medium uppercase tracking-wide text-ink-muted">
                      {t("comments")}
                    </p>
                    {proposal.comments.length > 0 && (
                      <ul className="mb-2 space-y-1.5">
                        {proposal.comments.map((comment) => (
                          <li
                            key={comment.id}
                            className={`rounded-lg p-2 text-sm ${
                              comment.authorType === "ORGANIZER"
                                ? "bg-warm text-ink"
                                : "bg-gold/10 text-ink"
                            }`}
                          >
                            <p className="text-[10px] font-medium uppercase tracking-wide text-ink-muted">
                              {comment.authorType === "ORGANIZER" ? t("you") : t("theCouple")} ·{" "}
                              {formatDateTime(comment.createdAt)}
                            </p>
                            <p>{comment.body}</p>
                          </li>
                        ))}
                      </ul>
                    )}
                    <form
                      action={replyToProposalComment.bind(null, lead.id, proposal.id)}
                      className="flex flex-wrap items-end gap-2"
                    >
                      <input
                        name="body"
                        required
                        placeholder={t("replyPlaceholder")}
                        className="flex-1 rounded-lg border border-gold/25 px-2 py-1 text-sm"
                      />
                      <button
                        type="submit"
                        className="rounded-lg border border-gold/25 px-3 py-1 text-sm hover:bg-warm"
                      >
                        {t("reply")}
                      </button>
                    </form>
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {showContracts && (
        <section className="mt-8">
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("contracts")}</h2>
          <form
            action={createContract.bind(null, lead.id)}
            className="mb-4 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <ContractTemplatePicker templates={contractTemplates} />
            <button
              type="submit"
              className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
            >
              {t("createContract")}
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
                      ? t("signedOn", { date: formatDateTime(contract.signedAt), name: contract.signerName ?? "" })
                      : t("pendingSignature")}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <CopyLinkButton url={`${baseUrl}/sign/${contract.token}`} label={t("copySignLink")} />
                  <form action={deleteContract.bind(null, lead.id, contract.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      {t("delete")}
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
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("invoices")}</h2>
          <form
            action={createInvoice.bind(null, lead.id)}
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">{t("description")}</label>
              <input
                name="description"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium mb-1">{t("amount")}</label>
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
              <label className="block text-xs font-medium mb-1">{t("currency")}</label>
              <input
                name="currency"
                defaultValue="mxn"
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("gateway")}</label>
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
              {t("createInvoice")}
            </button>
          </form>

          <form
            action={createPaymentPlan.bind(null, lead.id)}
            className="mb-4 flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
          >
            <p className="w-full text-sm font-medium text-ink">{t("createPaymentPlan")}</p>
            <div className="flex-1">
              <label className="block text-xs font-medium mb-1">{t("description")}</label>
              <input
                name="description"
                required
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-28">
              <label className="block text-xs font-medium mb-1">{t("totalAmount")}</label>
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
              <label className="block text-xs font-medium mb-1">{t("installments")}</label>
              <select name="installments" defaultValue="2" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm">
                <option value="2">2</option>
                <option value="3">3</option>
                <option value="4">4</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("firstInstallment")}</label>
              <input
                name="firstDueDate"
                type="date"
                className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div className="w-20">
              <label className="block text-xs font-medium mb-1">{t("currency")}</label>
              <input
                name="currency"
                defaultValue="mxn"
                className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-medium mb-1">{t("gateway")}</label>
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
              {t("createPlan")}
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
                      ? invoice.paidAt
                        ? t("paidOn", { date: formatDateTime(invoice.paidAt) })
                        : t("paid")
                      : invoice.dueDate
                        ? t("dueOn", { date: formatDateTime(invoice.dueDate) })
                        : t("pendingPayment")}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <CopyLinkButton url={`${baseUrl}/pay/${invoice.token}`} label={t("copyPayLink")} />
                  {invoice.status !== "paid" && lead.email && (
                    <form action={sendInvoiceReminder.bind(null, lead.id, invoice.id)}>
                      <button type="submit" className="text-sm text-gold-dark hover:underline">
                        {t("sendReminder")}
                      </button>
                    </form>
                  )}
                  <form action={deleteInvoice.bind(null, lead.id, invoice.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      {t("delete")}
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
