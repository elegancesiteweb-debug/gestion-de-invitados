import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/dates";
import { signContract } from "@/lib/actions/contracts";
import { PrintButton } from "@/components/PrintButton";

export default async function SignContractPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("signPage");

  const contract = await prisma.contract.findUnique({ where: { token } });
  if (!contract) {
    notFound();
  }

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10 print:px-0 print:py-0">
      <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl print:border-0 print:shadow-none">
        <div className="flex items-start justify-between gap-3">
          <h1 className="font-serif text-2xl font-medium text-ink">{contract.title}</h1>
          {contract.signedAt && <PrintButton />}
        </div>

        <div className="mt-4 whitespace-pre-wrap rounded-lg border border-gold/15 bg-white/70 p-4 text-sm text-ink">
          {contract.content}
        </div>

        {contract.signedAt ? (
          <div className="mt-6 rounded-lg border border-success/30 bg-success-bg p-4 text-sm text-success">
            <p className="font-medium">{t("alreadySigned")}</p>
            <p className="mt-1">
              {t("signedBy", { name: contract.signerName ?? "", date: formatDateTime(contract.signedAt) })}
            </p>
          </div>
        ) : (
          <form
            action={signContract.bind(null, token)}
            className="mt-6 space-y-3 rounded-lg border border-gold/20 bg-white/70 p-4"
          >
            <p className="font-medium text-ink">{t("electronicSignature")}</p>
            <div>
              <label className="block text-xs font-medium mb-1">{t("fullName")}</label>
              <input
                name="signerName"
                required
                className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
              />
            </div>
            <label className="flex items-start gap-2 text-sm text-ink-muted">
              <input name="agreed" type="checkbox" required className="mt-0.5" />
              {t("agreementText")}
            </label>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white hover:shadow-lg"
            >
              {t("signContract")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
