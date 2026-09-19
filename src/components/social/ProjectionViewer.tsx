"use client";

import { useProjectionCycle } from "@/components/social/useProjectionCycle";
import type { ProjectionItem } from "@/lib/actions/socialPortal";

export function ProjectionViewer({
  token,
  eventTitle,
  initialItems,
}: {
  token: string;
  eventTitle: string;
  initialItems: ProjectionItem[];
}) {
  const { current, advance } = useProjectionCycle(token, { initialItems });

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
              onEnded={advance}
            />
          ) : current.type === "AUDIO" ? (
            <div className="flex h-full w-full flex-col items-center justify-center gap-6 bg-gradient-to-br from-gold-dark to-gold-deep">
              <span className="text-7xl">🎵</span>
              <audio key={current.id} src={current.url} autoPlay onEnded={advance} />
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
