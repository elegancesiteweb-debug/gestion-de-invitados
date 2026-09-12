"use client";

import { useEffect, useRef, useState } from "react";
import { getProjectionFeed, type ProjectionItem } from "@/lib/actions/socialPortal";

const PHOTO_DURATION_MS = 6000;
const POLL_INTERVAL_MS = 20000;

export function ProjectionViewer({
  token,
  eventTitle,
  initialItems,
}: {
  token: string;
  eventTitle: string;
  initialItems: ProjectionItem[];
}) {
  const [items, setItems] = useState(initialItems);
  const [index, setIndex] = useState(0);
  const itemsRef = useRef(items);

  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  useEffect(() => {
    const interval = setInterval(async () => {
      try {
        const fresh = await getProjectionFeed(token);
        setItems(fresh);
      } catch {
        // silencioso: sigue mostrando lo que ya tenía si falla un ciclo de actualización
      }
    }, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [token]);

  // Módulo en vez de recortar el índice en un efecto: siempre cae dentro de rango
  // aunque la lista cambie de tamaño entre actualizaciones por polling.
  const safeIndex = items.length > 0 ? index % items.length : 0;
  const current = items[safeIndex] ?? null;

  useEffect(() => {
    if (!current || current.type !== "PHOTO") return;
    const timer = setTimeout(() => {
      setIndex((prev) => (itemsRef.current.length > 0 ? (prev + 1) % itemsRef.current.length : 0));
    }, PHOTO_DURATION_MS);
    return () => clearTimeout(timer);
  }, [current]);

  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black">
      {!current ? (
        <div className="text-center">
          <p className="font-serif text-2xl text-white">{eventTitle}</p>
          <p className="mt-3 text-white/60">Esperando los primeros recuerdos…</p>
        </div>
      ) : (
        <div key={current.id} className="relative h-full w-full animate-[fadeIn_0.8s_ease]">
          {current.type === "VIDEO" ? (
            <video
              key={current.id}
              src={current.url}
              autoPlay
              muted
              className="h-full w-full object-contain"
              onEnded={() => setIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0))}
            />
          ) : current.type === "AUDIO" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-gold-dark to-gold-deep">
              <span className="text-7xl">🎵</span>
              <audio
                key={current.id}
                src={current.url}
                autoPlay
                onEnded={() => setIndex((prev) => (items.length > 0 ? (prev + 1) % items.length : 0))}
              />
            </div>
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={current.id} src={current.url} alt="" className="h-full w-full object-contain" />
          )}
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/80 to-transparent p-6">
            <p className="font-serif text-lg text-white">{current.authorName}</p>
            {current.caption && <p className="mt-1 text-sm text-white/80">{current.caption}</p>}
          </div>
        </div>
      )}
    </div>
  );
}
