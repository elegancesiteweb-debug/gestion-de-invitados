"use client";

import { useTranslations } from "next-intl";
import { useTransition, type ChangeEvent } from "react";
import { setLocale } from "@/lib/actions/locale";
import type { AppLocale } from "@/lib/locale";

export function LanguageSwitcher({ currentLocale }: { currentLocale: AppLocale }) {
  const t = useTranslations("languageSwitcher");
  const [isPending, startTransition] = useTransition();

  function handleChange(e: ChangeEvent<HTMLSelectElement>) {
    const next = e.target.value as AppLocale;
    startTransition(() => {
      setLocale(next);
    });
  }

  return (
    <select
      value={currentLocale}
      onChange={handleChange}
      disabled={isPending}
      aria-label={t("label")}
      className="rounded-lg border border-gold/25 bg-white/70 px-2 py-1 text-xs text-ink disabled:opacity-50"
    >
      <option value="es">{t("es")}</option>
      <option value="en">{t("en")}</option>
    </select>
  );
}
