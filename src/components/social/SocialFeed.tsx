"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslations } from "next-intl";
import { SocialUploadButton } from "@/components/social/SocialUploadButton";
import { SocialPostCard, type FeedPost } from "@/components/social/SocialPostCard";
import { HighlightsCarousel, type HighlightPost } from "@/components/social/HighlightsCarousel";

type FeedStory = { id: string; type: "PHOTO" | "VIDEO" | "AUDIO"; url: string; authorName: string };
type PostFilter = "ALL" | "PHOTO" | "VIDEO" | "AUDIO";

const STORY_PHOTO_DURATION_MS = 5000;

// Una historia por instancia: al remontar (la key en la llamada es el id de la
// historia actual) el progreso arranca solo en 0 sin necesidad de un efecto
// que lo reinicie a mano.
function StoryOverlay({
  stories,
  index,
  onClose,
  onPrev,
  onNext,
  closeLabel,
  previousLabel,
  nextLabel,
}: {
  stories: FeedStory[];
  index: number;
  onClose: () => void;
  onPrev: () => void;
  onNext: () => void;
  closeLabel: string;
  previousLabel: string;
  nextLabel: string;
}) {
  const story = stories[index];
  const [progress, setProgress] = useState(0);
  const mediaRef = useRef<HTMLMediaElement>(null);

  useEffect(() => {
    if (story.type !== "PHOTO") return;
    const start = Date.now();
    const interval = setInterval(() => {
      setProgress(Math.min(100, ((Date.now() - start) / STORY_PHOTO_DURATION_MS) * 100));
    }, 50);
    return () => clearInterval(interval);
  }, [story]);

  useEffect(() => {
    if (story.type !== "PHOTO") return;
    const timer = setTimeout(onNext, STORY_PHOTO_DURATION_MS);
    return () => clearTimeout(timer);
  }, [story, onNext]);

  function handleTimeUpdate() {
    const media = mediaRef.current;
    if (!media || !media.duration) return;
    setProgress((media.currentTime / media.duration) * 100);
  }

  return (
    <div className="relative h-full w-full max-w-md">
      {story.type === "VIDEO" ? (
        <video
          ref={mediaRef as React.RefObject<HTMLVideoElement>}
          src={story.url}
          autoPlay
          playsInline
          className="h-full w-full object-contain"
          onTimeUpdate={handleTimeUpdate}
          onEnded={onNext}
        />
      ) : story.type === "AUDIO" ? (
        <div className="flex h-full w-full flex-col items-center justify-center gap-4 bg-gradient-to-br from-gold-dark to-gold-deep text-white">
          <span className="text-5xl">🎵</span>
          <audio
            ref={mediaRef as React.RefObject<HTMLAudioElement>}
            src={story.url}
            autoPlay
            onTimeUpdate={handleTimeUpdate}
            onEnded={onNext}
          />
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={story.url} alt="" className="h-full w-full object-contain" />
      )}
      <div className="absolute inset-x-2 top-2 flex gap-1">
        {stories.map((s, i) => (
          <div key={s.id} className="h-1 flex-1 overflow-hidden rounded-full bg-white/30">
            <div
              className="h-full bg-white"
              style={{
                width: `${i < index ? 100 : i === index ? progress : 0}%`,
                transition: i === index ? "width 80ms linear" : "none",
              }}
            />
          </div>
        ))}
      </div>
      <div className="absolute inset-x-0 top-5 flex items-center justify-between p-3">
        <span className="rounded-full bg-black/50 px-3 py-1 text-xs text-white">{story.authorName}</span>
        <button
          type="button"
          onClick={onClose}
          className="rounded-full bg-black/50 px-3 py-1 text-sm text-white"
        >
          {closeLabel}
        </button>
      </div>
      <button
        type="button"
        aria-label={previousLabel}
        onClick={onPrev}
        className="absolute inset-y-0 left-0 w-1/3"
      />
      <button
        type="button"
        aria-label={nextLabel}
        onClick={onNext}
        className="absolute inset-y-0 right-0 w-1/3"
      />
    </div>
  );
}

export function SocialFeed({
  token,
  eventTitle,
  myName,
  posts,
  stories,
  coverImageUrl,
  coupleImageUrl,
  topUploaderName,
  highlightPosts,
}: {
  token: string;
  eventTitle: string;
  myName: string;
  posts: FeedPost[];
  stories: FeedStory[];
  coverImageUrl: string | null;
  coupleImageUrl: string | null;
  topUploaderName: string | null;
  highlightPosts: HighlightPost[];
}) {
  const t = useTranslations("socialPage");
  const [viewingIndex, setViewingIndex] = useState<number | null>(null);
  const [filter, setFilter] = useState<PostFilter>("ALL");

  const hasAudio = useMemo(() => posts.some((p) => p.type === "AUDIO"), [posts]);
  const filteredPosts = useMemo(
    () => (filter === "ALL" ? posts : posts.filter((p) => p.type === filter)),
    [posts, filter]
  );

  const closeViewer = useCallback(() => setViewingIndex(null), []);
  const goPrev = useCallback(
    () => setViewingIndex((prev) => (prev != null && prev > 0 ? prev - 1 : prev)),
    []
  );
  const goNext = useCallback(
    () => setViewingIndex((prev) => (prev != null && prev < stories.length - 1 ? prev + 1 : null)),
    [stories.length]
  );

  return (
    <div className="relative min-h-screen w-full bg-gradient-to-br from-beige-glass via-warm to-terracotta-glass/60">
      <div className="mx-auto w-full max-w-lg px-4 py-6">
        {coverImageUrl && (
          <div className="relative mb-10">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={coverImageUrl}
              alt=""
              className="h-40 w-full rounded-3xl border border-white/40 object-cover shadow-lg"
            />
            {coupleImageUrl && (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={coupleImageUrl}
                alt=""
                className="absolute -bottom-8 left-1/2 h-20 w-20 -translate-x-1/2 rounded-full border-4 border-white object-cover shadow-lg"
              />
            )}
          </div>
        )}

        <header className="rounded-2xl border border-white/40 bg-white/40 py-4 text-center shadow-md backdrop-blur-xl">
          <p className="text-xs uppercase tracking-[0.25em] text-gold-dark">{t("title")}</p>
          <h1 className="mt-1 font-serif text-2xl font-medium text-ink">{eventTitle}</h1>
          <p className="mt-1 text-xs text-ink-muted">{t("greeting", { name: myName })}</p>
        </header>

        {highlightPosts.length > 0 && (
          <HighlightsCarousel topUploaderName={topUploaderName} posts={highlightPosts} />
        )}

        {stories.length > 0 && (
          <div className="mt-5 flex gap-3 overflow-x-auto rounded-2xl border border-white/30 bg-white/25 p-3 backdrop-blur-xl">
            {stories.map((story, i) => (
              <button
                key={story.id}
                type="button"
                onClick={() => setViewingIndex(i)}
                className="flex flex-none flex-col items-center gap-1"
              >
                <span className="flex h-[4.5rem] w-[4.5rem] items-center justify-center rounded-full bg-gradient-to-br from-gold via-gold-dark to-gold-deep p-[3px] shadow-md shadow-gold/20">
                  <span className="flex h-full w-full items-center justify-center rounded-full bg-warm p-0.5">
                    {story.type === "VIDEO" ? (
                      <video src={story.url} className="h-full w-full rounded-full object-cover" />
                    ) : story.type === "AUDIO" ? (
                      <span className="flex h-full w-full items-center justify-center rounded-full bg-gold-dark text-xl text-white">
                        🎵
                      </span>
                    ) : (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={story.url} alt="" className="h-full w-full rounded-full object-cover" />
                    )}
                  </span>
                </span>
                <span className="max-w-16 truncate text-[10px] text-ink-muted">{story.authorName}</span>
              </button>
            ))}
          </div>
        )}

        {posts.length > 0 && (
          <div className="mt-5 flex flex-wrap gap-2">
            {(["ALL", "PHOTO", "VIDEO", ...(hasAudio ? (["AUDIO"] as const) : [])] as PostFilter[]).map(
              (option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setFilter(option)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-medium backdrop-blur-md transition ${
                    filter === option
                      ? "border-gold-dark bg-gold-dark text-white"
                      : "border-white/40 bg-white/40 text-ink-muted hover:bg-white/60"
                  }`}
                >
                  {t(`filter${option}`)}
                </button>
              )
            )}
          </div>
        )}

        <div className="mt-6 space-y-4 pb-24">
          {filteredPosts.length === 0 ? (
            <p className="py-10 text-center text-sm text-ink-muted">{t("empty")}</p>
          ) : (
            filteredPosts.map((post) => <SocialPostCard key={post.id} token={token} post={post} />)
          )}
        </div>

        <div className="fixed bottom-6 left-1/2 z-40 w-full max-w-lg -translate-x-1/2 px-4">
          <div className="ml-auto w-fit">
            <SocialUploadButton token={token} />
          </div>
        </div>

        {viewingIndex != null &&
          createPortal(
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black">
              <StoryOverlay
                key={stories[viewingIndex].id}
                stories={stories}
                index={viewingIndex}
                onClose={closeViewer}
                onPrev={goPrev}
                onNext={goNext}
                closeLabel={t("close")}
                previousLabel={t("previous")}
                nextLabel={t("next")}
              />
            </div>,
            document.body
          )}
      </div>
    </div>
  );
}
