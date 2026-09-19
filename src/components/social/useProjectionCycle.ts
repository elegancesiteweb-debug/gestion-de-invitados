"use client";

import { useEffect, useRef, useState } from "react";
import { getProjectionFeed, type ProjectionItem } from "@/lib/actions/socialPortal";

const PHOTO_DURATION_MS = 6000;
const POLL_INTERVAL_MS = 20000;

// Qué se debe estar mostrando ahora mismo, y cuándo pasar al siguiente —
// misma lógica compartida por la pantalla de proyección abierta en un
// navegador (ProjectionViewer) y por la transmisión a un Chromecast
// (CastButton), para que el ritmo sea idéntico sin importar el camino.
// `enabled: false` (CastButton, mientras no hay una sesión de Cast activa)
// no hace ninguna consulta — evita pedir el feed cada 20s sin necesidad.
export function useProjectionCycle(
  token: string,
  options?: { initialItems?: ProjectionItem[]; enabled?: boolean }
) {
  const { initialItems = [], enabled = true } = options ?? {};
  const [items, setItems] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    if (!enabled) return;
    let cancelled = false;

    async function fetchFeed() {
      try {
        const fresh = await getProjectionFeed(token);
        if (!cancelled) setItems(fresh);
      } catch {
        // silencioso: sigue mostrando lo que ya tenía si falla un ciclo de actualización
      }
    }

    void fetchFeed();
    const interval = setInterval(fetchFeed, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [token, enabled]);

  // Módulo en vez de recortar el índice en un efecto: siempre cae dentro de rango
  // aunque la lista cambie de tamaño entre actualizaciones por polling.
  const safeIndex = items.length > 0 ? index % items.length : 0;
  const current: ProjectionItem | null = enabled ? (items[safeIndex] ?? null) : null;

  function advance() {
    setIndex((prev) => (itemsRef.current.length > 0 ? (prev + 1) % itemsRef.current.length : 0));
  }

  useEffect(() => {
    if (!current || current.type !== "PHOTO") return;
    const timer = setTimeout(advance, PHOTO_DURATION_MS);
    return () => clearTimeout(timer);
  }, [current]);

  return { current, advance };
}
