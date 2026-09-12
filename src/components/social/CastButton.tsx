"use client";

import { useState, useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";

function subscribeNoop() {
  return () => {};
}

function getSupportSnapshot() {
  return typeof window !== "undefined" && "PresentationRequest" in window;
}

function getServerSupportSnapshot() {
  return false;
}

// Presentation API: es el mecanismo estándar detrás del diálogo "Buscar
// dispositivos" de Chrome para mandar una página a un Chromecast/TV
// compatible. Solo Chromium la soporta — en navegadores sin soporte (Safari,
// Firefox) el botón simplemente no se muestra, sin alternativa AirPlay, ya
// que la proyección no es un único <video> sino un slideshow compuesto.
export function CastButton({ url }: { url: string }) {
  const t = useTranslations("socialPanel");
  const supported = useSyncExternalStore(subscribeNoop, getSupportSnapshot, getServerSupportSnapshot);
  const [error, setError] = useState<string | null>(null);

  async function handleClick() {
    setError(null);
    try {
      const PresentationRequestCtor = (
        window as unknown as { PresentationRequest: new (urls: string[]) => { start: () => Promise<unknown> } }
      ).PresentationRequest;
      const request = new PresentationRequestCtor([url]);
      await request.start();
    } catch {
      setError(t("castError"));
    }
  }

  if (!supported) return null;

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gold/25 bg-white px-3 py-1.5 text-sm text-gold-dark hover:bg-warm"
      >
        <span aria-hidden>📺</span> {t("castButton")}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
    </div>
  );
}
