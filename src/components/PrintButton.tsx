"use client";

import { useTranslations } from "next-intl";

export function PrintButton() {
  const t = useTranslations("shared");
  return (
    <button
      onClick={() => window.print()}
      type="button"
      className="print:hidden rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2 text-sm font-medium text-white shadow-md shadow-gold/30 transition hover:shadow-lg hover:shadow-gold/40"
    >
      {t("printOrSavePdf")}
    </button>
  );
}
