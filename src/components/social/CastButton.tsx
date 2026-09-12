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

type Platform = "ios" | "android" | "other";

function getPlatformSnapshot(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

function getServerPlatformSnapshot(): Platform {
  return "other";
}

// Presentation API: es el mecanismo estándar detrás del diálogo "Buscar
// dispositivos" de Chrome para mandar una página a un Chromecast/TV
// compatible. Solo la soportan navegadores Chromium de escritorio — en
// celulares (iOS Safari, y Chrome/Android en la práctica) no está disponible,
// así que ahí el botón muestra instrucciones para usar el mecanismo nativo
// del teléfono (AirPlay / "Transmitir" de Chrome) en vez de desaparecer.
export function CastButton({ url }: { url: string }) {
  const t = useTranslations("socialPanel");
  const supported = useSyncExternalStore(subscribeNoop, getSupportSnapshot, getServerSupportSnapshot);
  const platform = useSyncExternalStore(subscribeNoop, getPlatformSnapshot, getServerPlatformSnapshot);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  async function handleClick() {
    if (!supported) {
      setShowHelp((prev) => !prev);
      return;
    }
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

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gold/25 bg-white px-3 py-1.5 text-sm text-gold-dark hover:bg-warm"
      >
        <span aria-hidden>📺</span> {supported ? t("castButton") : t("castHowTo")}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {showHelp && !supported && (
        <p className="mt-1 max-w-xs text-xs text-ink-muted">
          {platform === "ios" ? t("castHelpIos") : platform === "android" ? t("castHelpAndroid") : t("castHelpOther")}
        </p>
      )}
    </div>
  );
}
