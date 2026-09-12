"use client";

import { useTranslations } from "next-intl";

export type HighlightPost = {
  id: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  url: string;
  authorName: string;
  likeCount: number;
};

// Vista previa de solo lectura: la interacción completa (like, comentar, ver
// en grande) vive en el muro principal de abajo — esto es un carrusel de
// descubrimiento, no una segunda copia de esa lógica.
export function HighlightsCarousel({
  topUploaderName,
  posts,
}: {
  topUploaderName: string | null;
  posts: HighlightPost[];
}) {
  const t = useTranslations("socialPage");

  return (
    <section className="mt-6">
      <div className="flex items-center justify-between px-1">
        <h2 className="font-serif text-base font-medium text-ink">{t("highlightsTitle")}</h2>
        {topUploaderName && (
          <span className="rounded-full bg-white/50 px-3 py-1 text-xs font-medium text-gold-dark backdrop-blur-md">
            🏆 {t("topUploader", { name: topUploaderName })}
          </span>
        )}
      </div>

      <div className="mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2">
        {posts.map((post, i) => (
          <div
            key={post.id}
            className="w-40 flex-none snap-center animate-[fadeIn_0.5s_ease] overflow-hidden rounded-2xl border border-white/40 bg-white/40 shadow-md backdrop-blur-xl"
            style={{ animationDelay: `${i * 60}ms`, animationFillMode: "backwards" }}
          >
            {post.type === "AUDIO" ? (
              <div className="flex h-28 w-full items-center justify-center bg-gradient-to-br from-gold-light/40 to-gold/20 text-2xl">
                🎵
              </div>
            ) : post.type === "VIDEO" ? (
              <video src={post.url} muted className="h-28 w-full object-cover" />
            ) : (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={post.url} alt="" className="h-28 w-full object-cover" />
            )}
            <div className="p-2">
              <p className="truncate text-xs font-medium text-ink">{post.authorName}</p>
              <p className="text-[11px] text-ink-muted">♥ {post.likeCount}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
