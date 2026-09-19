"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import QRCode from "qrcode";
import { useTranslations } from "next-intl";

export function SocialQrButton({ url, eventTitle }: { url: string; eventTitle: string }) {
  const t = useTranslations("shared");
  const [open, setOpen] = useState(false);
  const [dataUrl, setDataUrl] = useState<string | null>(null);

  async function handleOpen() {
    if (!dataUrl) {
      const generated = await QRCode.toDataURL(url, { width: 320, margin: 1 });
      setDataUrl(generated);
    }
    setOpen(true);
  }

  return (
    <>
      <button onClick={handleOpen} type="button" className="text-sm text-gold-dark hover:underline">
        {t("viewQr")}
      </button>

      {open &&
        createPortal(
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4"
            onClick={() => setOpen(false)}
          >
            <div
              className="w-full max-w-xs rounded-lg bg-white p-6 text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <p className="mb-3 font-medium">{eventTitle}</p>

              {dataUrl && (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={dataUrl} alt={`QR ${eventTitle}`} className="mx-auto" />
              )}

              <div className="mt-4 flex justify-center gap-3">
                {dataUrl && (
                  <a
                    href={dataUrl}
                    download={`qr-muro-recuerdos-${eventTitle.replace(/\s+/g, "-").toLowerCase()}.png`}
                    className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
                  >
                    {t("download")}
                  </a>
                )}
                <button
                  onClick={() => setOpen(false)}
                  type="button"
                  className="rounded-lg border border-gold/25 px-3 py-1.5 text-sm hover:bg-warm"
                >
                  {t("close")}
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
}
