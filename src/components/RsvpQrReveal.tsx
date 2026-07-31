"use client";

import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";

export function RsvpQrReveal({ url, fileLabel }: { url: string; fileLabel: string }) {
  const t = useTranslations("rsvpForm");
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    QRCode.toDataURL(url, { width: 320, margin: 1 }).then((generated) => {
      if (!cancelled) setDataUrl(generated);
    });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (!dataUrl) return null;

  return (
    <div className="mt-4 rounded-lg border border-gold/20 bg-white/70 p-4 text-center">
      <p className="text-xs text-ink-muted">{t("saveQrHint")}</p>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={dataUrl} alt={t("accessQrAlt")} className="mx-auto mt-2" />
      <a
        href={dataUrl}
        download={`qr-acceso-${fileLabel}.png`}
        className="mt-2 inline-block rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
      >
        {t("saveQr")}
      </a>
    </div>
  );
}
