"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { loadCastSdk, getCastContext, buildLoadRequest } from "@/lib/googleCast";
import { useProjectionCycle } from "@/components/social/useProjectionCycle";

type Platform = "ios" | "android" | "other";

function getPlatform(): Platform {
  if (typeof navigator === "undefined") return "other";
  const ua = navigator.userAgent;
  if (/iPhone|iPad|iPod/.test(ua)) return "ios";
  if (/Android/.test(ua)) return "android";
  return "other";
}

// Transmisión real tipo Netflix: el SDK de Google Cast (cargado por script
// tag, no es una dependencia npm) abre el selector nativo de Chromecast y,
// una vez conectado, el propio Chromecast reproduce el contenido directo
// desde R2 — no hay mirror de esta página. El ritmo (cuándo pasar a la
// siguiente foto/video) lo decide useProjectionCycle aquí mismo, en vez de
// una cola nativa de Cast, porque su comportamiento con fotos no se puede
// verificar sin un Chromecast real; un loadMedia() por cambio es la
// operación más básica y confiable del SDK. Solo funciona en navegadores
// Chromium (no Safari/AirPlay) — ahí se muestra la guía "Cómo transmitir"
// de siempre en su lugar.
export function CastButton({ token }: { token: string }) {
  const t = useTranslations("socialPanel");
  const [sdkAvailable, setSdkAvailable] = useState<boolean | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);
  const { current } = useProjectionCycle(token, { enabled: connected });

  useEffect(() => {
    let cancelled = false;
    loadCastSdk().then((available) => {
      if (cancelled) return;
      setSdkAvailable(available);
      // Prepara el contexto de Cast apenas el SDK está listo, no hasta que
      // el usuario presiona el botón — la búsqueda de pantallas de Google
      // tarda un momento en encontrar dispositivos, y pedir una sesión de
      // inmediato sin haberle dado ese tiempo hacía que pareciera que no
      // encontraba nada aunque el Chromecast sí estuviera disponible (el
      // propio "Transmitir..." de Chrome, que empieza a buscar desde que el
      // navegador arranca, sí lo encontraba).
      if (available) {
        try {
          getCastContext();
        } catch (err) {
          console.error("[Cast] getCastContext() falló durante la preparación temprana:", err);
        }
      }
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!connected || !current) return;
    try {
      const session = getCastContext().getCurrentSession();
      session?.loadMedia(buildLoadRequest(current)).catch(() => {
        // best-effort: si un elemento falla en cargar, el siguiente ciclo lo reintenta
      });
    } catch (err) {
      console.error("[Cast] no se pudo cargar el siguiente recuerdo en la pantalla:", err);
    }
  }, [connected, current]);

  async function handleClick() {
    if (!sdkAvailable) {
      setShowHelp((prev) => !prev);
      return;
    }
    if (connected) {
      getCastContext().endCurrentSession(true);
      setConnected(false);
      return;
    }
    setError(null);
    setConnecting(true);
    try {
      await getCastContext().requestSession();
      setConnected(true);
    } catch (err) {
      // El SDK usa el mismo código "cancel" tanto si el usuario cierra el
      // selector a propósito como si nunca encontró ninguna pantalla que
      // mostrar — no se puede distinguir uno de otro, así que se avisa en
      // vez de fallar en silencio (antes esto no mostraba nada, lo que hacía
      // parecer que el botón simplemente no hacía nada al presionarlo).
      console.error("Google Cast requestSession falló:", err);
      const code = (err as { code?: string } | undefined)?.code;
      setError(code === "cancel" ? t("castNoDevices") : t("castError"));
    } finally {
      setConnecting(false);
    }
  }

  const platform = getPlatform();

  return (
    <div>
      <button
        type="button"
        onClick={handleClick}
        disabled={connecting}
        className="inline-flex items-center gap-1.5 rounded-lg border border-gold/25 bg-white px-3 py-1.5 text-sm text-gold-dark hover:bg-warm disabled:opacity-50"
      >
        <span aria-hidden>📺</span>{" "}
        {sdkAvailable === false
          ? t("castHowTo")
          : connected
            ? t("stopCasting")
            : connecting
              ? t("castConnecting")
              : t("castButton")}
      </button>
      {error && <p className="mt-1 text-xs text-danger">{error}</p>}
      {connected && <p className="mt-1 text-xs text-success">{t("castConnected")}</p>}
      {showHelp && sdkAvailable === false && (
        <p className="mt-1 max-w-xs text-xs text-ink-muted">
          {platform === "ios" ? t("castHelpIos") : platform === "android" ? t("castHelpAndroid") : t("castHelpOther")}
        </p>
      )}
    </div>
  );
}
