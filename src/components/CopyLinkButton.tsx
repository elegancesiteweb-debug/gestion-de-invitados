"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function CopyLinkButton({ url, label }: { url: string; label?: string }) {
  const t = useTranslations("shared");
  const [copied, setCopied] = useState(false);

  async function handleCopy() {
    await navigator.clipboard.writeText(url);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <button
      onClick={handleCopy}
      type="button"
      className="text-sm text-gold-dark hover:underline"
    >
      {copied ? t("copied") : label ?? t("copyLink")}
    </button>
  );
}
