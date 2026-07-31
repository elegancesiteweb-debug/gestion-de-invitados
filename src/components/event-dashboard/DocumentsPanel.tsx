import type { Contract, Invoice } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { uploadEventDocument, deleteEventDocument } from "@/lib/actions/documents";
import { formatDateTime } from "@/lib/dates";

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type DocumentSummary = {
  id: string;
  name: string;
  fileSize: number;
  createdAt: Date;
};

export async function DocumentsPanel({
  eventId,
  contracts,
  invoices,
  documents,
}: {
  eventId: string;
  contracts: Contract[];
  invoices: Invoice[];
  documents: DocumentSummary[];
}) {
  const t = await getTranslations("documents");

  return (
    <div className="space-y-6 py-6">
      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("contracts")}</h2>
        {contracts.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noContracts")}</p>
        ) : (
          <div className="space-y-2">
            {contracts.map((contract) => (
              <div
                key={contract.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{contract.title}</p>
                  <p className="text-xs text-ink-muted">
                    {contract.signedAt
                      ? t("signedOn", { date: formatDateTime(contract.signedAt) })
                      : t("pendingSignature")}
                  </p>
                </div>
                <a href={`/sign/${contract.token}`} className="text-sm text-gold-dark hover:underline">
                  {t("viewDownload")}
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("invoices")}</h2>
        {invoices.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noInvoices")}</p>
        ) : (
          <div className="space-y-2">
            {invoices.map((invoice) => (
              <div
                key={invoice.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-ink">
                    {invoice.description}{" "}
                    <span className="text-ink-muted">
                      · {invoice.amount.toLocaleString("es-MX", { style: "currency", currency: invoice.currency })}
                    </span>
                  </p>
                  <p className="text-xs text-ink-muted">
                    {invoice.status === "paid" ? t("paid") : t("pendingPayment")}
                  </p>
                </div>
                <a href={`/pay/${invoice.token}`} className="text-sm text-gold-dark hover:underline">
                  {t("view")}
                </a>
              </div>
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">{t("files")}</h2>
        <form
          action={uploadEventDocument.bind(null, eventId)}
          className="flex flex-wrap items-end gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl"
        >
          <div>
            <label className="block text-xs font-medium mb-1">{t("nameOptional")}</label>
            <input name="name" className="rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div className="flex-1">
            <label className="block text-xs font-medium mb-1">{t("file")}</label>
            <input name="file" type="file" required className="text-sm" />
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("upload")}
          </button>
        </form>
        <p className="mt-1 text-xs text-ink-muted">{t("sizeLimit")}</p>

        {documents.length > 0 && (
          <div className="mt-4 space-y-2">
            {documents.map((document) => (
              <div
                key={document.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-3 shadow-sm"
              >
                <div>
                  <p className="text-sm font-medium text-ink">{document.name}</p>
                  <p className="text-xs text-ink-muted">
                    {formatFileSize(document.fileSize)} · {formatDateTime(document.createdAt)}
                  </p>
                </div>
                <div className="flex flex-none items-center gap-3">
                  <a
                    href={`/api/event-documents/${document.id}`}
                    className="text-sm text-gold-dark hover:underline"
                  >
                    {t("download")}
                  </a>
                  <form action={deleteEventDocument.bind(null, eventId, document.id)}>
                    <button type="submit" className="text-sm text-danger hover:underline">
                      {t("delete")}
                    </button>
                  </form>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
