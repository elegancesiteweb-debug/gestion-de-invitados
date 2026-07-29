"use client";

import { useState } from "react";

export function CopyLinkButton({ url }: { url: string }) {
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
      className="text-sm text-indigo-600 hover:underline"
    >
      {copied ? "¡Copiado!" : "Copiar link"}
    </button>
  );
}
