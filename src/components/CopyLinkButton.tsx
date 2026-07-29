"use client";

import { useState } from "react";

export function CopyLinkButton({ url, label = "Copiar link" }: { url: string; label?: string }) {
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
      {copied ? "¡Copiado!" : label}
    </button>
  );
}
