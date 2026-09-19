import { EXTENSION_MIME_MAP } from "@/lib/mediaType";

// Tipos mínimos a mano para la superficie del SDK de Google Cast que
// realmente usamos — deliberadamente no se agrega @types/chromecast-caf-sender
// como dependencia nueva solo para esto (SDK cargado por script tag, no npm).
interface GCastMediaMetadata {
  metadataType: number;
  title?: string;
  images?: { url: string }[];
}

interface GCastMediaInfo {
  metadata?: GCastMediaMetadata;
}

interface GCastLoadRequest {
  autoplay?: boolean;
}

interface GCastSession {
  loadMedia(request: GCastLoadRequest): Promise<unknown>;
}

interface GCastContext {
  setOptions(options: { receiverApplicationId: string; autoJoinPolicy: string }): void;
  requestSession(): Promise<unknown>;
  getCurrentSession(): GCastSession | null;
  endCurrentSession(stopCasting: boolean): void;
}

interface GCastWindow extends Window {
  __onGCastApiAvailable?: (isAvailable: boolean) => void;
  cast?: {
    framework: {
      CastContext: { getInstance(): GCastContext };
    };
  };
  chrome?: {
    cast: {
      media: {
        DEFAULT_MEDIA_RECEIVER_APP_ID: string;
        MediaInfo: new (contentId: string, contentType: string) => GCastMediaInfo;
        GenericMediaMetadata: new () => GCastMediaMetadata;
        LoadRequest: new (mediaInfo: GCastMediaInfo) => GCastLoadRequest;
        MetadataType: { GENERIC: number };
      };
      AutoJoinPolicy: { ORIGIN_SCOPED: string };
    };
  };
}

function getWindow(): GCastWindow {
  return window as unknown as GCastWindow;
}

let sdkPromise: Promise<boolean> | null = null;

// Inyecta el script del SDK de Google Cast una sola vez (aunque se llame
// varias veces desde distintos componentes) y resuelve cuando confirma que
// de verdad está disponible — no todo navegador que carga el script trae
// Cast real (Safari/Firefox no, por ejemplo).
//
// Importante: se confía directamente en el "isAvailable" que manda Google —
// una versión anterior también exigía que "cast.framework" ya existiera en
// ese mismo instante, pero el SDK a veces lo termina de adjuntar una
// fracción de segundo después de disparar el callback, así que esa
// verificación extra podía reportar "no disponible" por una carrera de
// tiempos aunque Google sí hubiera confirmado que sí lo está.
export function loadCastSdk(): Promise<boolean> {
  if (typeof window === "undefined") return Promise.resolve(false);
  if (sdkPromise) return sdkPromise;

  sdkPromise = new Promise((resolve) => {
    const w = getWindow();
    if (w.cast?.framework) {
      resolve(true);
      return;
    }
    w.__onGCastApiAvailable = (isAvailable) => {
      resolve(Boolean(isAvailable));
    };
    const script = document.createElement("script");
    script.src = "https://www.gstatic.com/cv/js/sender/v1/cast_sender.js";
    script.async = true;
    script.onerror = () => resolve(false);
    document.head.appendChild(script);
  });

  return sdkPromise;
}

// Receptor genérico gratuito de Google (sin diseño propio, sin registro) —
// decisión confirmada con el usuario.
export function getCastContext(): GCastContext {
  const w = getWindow();
  const context = w.cast!.framework.CastContext.getInstance();
  context.setOptions({
    receiverApplicationId: w.chrome!.cast.media.DEFAULT_MEDIA_RECEIVER_APP_ID,
    autoJoinPolicy: w.chrome!.cast.AutoJoinPolicy.ORIGIN_SCOPED,
  });
  return context;
}

export function inferContentType(urlOrStorageKey: string): string {
  const withoutQuery = urlOrStorageKey.split("?")[0];
  const ext = withoutQuery.split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIME_MAP[ext] ?? "application/octet-stream";
}

// Un solo elemento a la vez, no una cola nativa de Cast — el ritmo real
// (cuándo pasar a la siguiente foto/video) lo decide useProjectionCycle en
// el navegador que transmite, no el receptor, así ambos caminos (pantalla
// abierta en un navegador vs. transmitido a un Chromecast) usan la misma
// lógica de avance ya probada.
export function buildLoadRequest(item: {
  url: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  authorName: string;
}): GCastLoadRequest {
  const w = getWindow();
  const contentType = inferContentType(item.url);
  const mediaInfo = new w.chrome!.cast.media.MediaInfo(item.url, contentType);
  const metadata = new w.chrome!.cast.media.GenericMediaMetadata();
  metadata.metadataType = w.chrome!.cast.media.MetadataType.GENERIC;
  metadata.title = item.authorName;
  if (item.type !== "AUDIO") {
    metadata.images = [{ url: item.url }];
  }
  mediaInfo.metadata = metadata;
  const request = new w.chrome!.cast.media.LoadRequest(mediaInfo);
  request.autoplay = true;
  return request;
}
