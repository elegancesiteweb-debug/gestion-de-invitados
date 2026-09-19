"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { toggleLike, createComment, deleteMyPost } from "@/lib/actions/socialPortal";
import { MediaLightbox } from "@/components/social/MediaLightbox";
import { formatDateTime } from "@/lib/dates";

type Comment = { id: string; body: string; authorName: string };

function subscribeNoop() {
  return () => {};
}
function getShareSupported() {
  return typeof navigator !== "undefined" && "share" in navigator;
}
function getServerShareSupported() {
  return false;
}

function CommentIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M12 3C6.99 3 3 6.58 3 11c0 2.3 1.09 4.36 2.84 5.8-.1.98-.46 2.24-1.34 3.55a.5.5 0 0 0 .55.76c1.9-.5 3.5-1.28 4.66-2 .74.16 1.51.24 2.29.24 5.01 0 9-3.58 9-8s-3.99-8-9-8Z" />
    </svg>
  );
}

function ShareIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M3.4 20.6 21 12 3.4 3.4 3 10l12 2-12 2z" />
    </svg>
  );
}

function BookmarkIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden>
      <path d="M6 2h12a1 1 0 0 1 1 1v19l-7-4-7 4V3a1 1 0 0 1 1-1Z" />
    </svg>
  );
}

function AudioWaveIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" aria-hidden>
      <path d="M4 12v1M8 9v7M12 5v15M16 9v7M20 12v1" />
    </svg>
  );
}

function TrashIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden>
      <path d="M9 3a1 1 0 0 0-1 1v1H4v2h1.1l.8 12.1A2 2 0 0 0 7.9 21h8.2a2 2 0 0 0 2-1.9L18.9 7H20V5h-4V4a1 1 0 0 0-1-1H9Zm1 2h4v0h-4Zm-1.9 2h9.8l-.8 12H8.9l-.8-12ZM10 9v9h1.5V9H10Zm2.5 0v9H14V9h-1.5Z" />
    </svg>
  );
}

export type FeedPost = {
  id: string;
  type: "PHOTO" | "VIDEO" | "AUDIO";
  url: string;
  mediaUrls: string[];
  caption: string | null;
  authorName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
  isMine: boolean;
};

const COMMENT_PREVIEW_COUNT = 2;

export function SocialPostCard({ token, post }: { token: string; post: FeedPost }) {
  const t = useTranslations("socialPage");
  const router = useRouter();
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [showAllComments, setShowAllComments] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [deleting, setDeleting] = useState(false);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isPending, startTransition] = useTransition();
  const shareSupported = useSyncExternalStore(subscribeNoop, getShareSupported, getServerShareSupported);

  async function handleShare() {
    try {
      await navigator.share({ url: post.url, text: post.caption ?? undefined });
    } catch {
      // el usuario canceló el diálogo de compartir — no es un error a mostrar
    }
  }

  function handleDelete() {
    if (!window.confirm(t("confirmDelete"))) return;
    setDeleting(true);
    startTransition(async () => {
      await deleteMyPost(token, post.id);
      router.refresh();
    });
  }

  function handleLike() {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    setPulseKey((prev) => prev + 1);
    startTransition(async () => {
      await toggleLike(token, post.id);
    });
  }

  function handleCarouselScroll(e: React.UIEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    if (el.clientWidth === 0) return;
    setCarouselIndex(Math.round(el.scrollLeft / el.clientWidth));
  }

  function handleComment(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const body = commentText.trim();
    if (!body) return;
    setComments((prev) => [...prev, { id: `pending-${Date.now()}`, body, authorName: t("you") }]);
    setCommentText("");
    const formData = new FormData();
    formData.set("body", body);
    startTransition(async () => {
      await createComment(token, post.id, formData);
    });
  }

  return (
    <div className="overflow-hidden rounded-3xl border border-gold/20 bg-white shadow-md shadow-gold/5">
      <div className="flex items-center gap-2.5 px-3.5 py-3">
        <span className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold via-gold-dark to-gold-deep text-xs font-semibold text-white shadow-sm">
          {post.authorName.charAt(0).toUpperCase()}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium text-ink">{post.authorName}</p>
          <p className="text-[11px] text-ink-light">{formatDateTime(new Date(post.createdAt))}</p>
        </div>
        {post.isMine && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            aria-label={t("delete")}
            className="text-ink-light hover:text-danger disabled:opacity-50"
          >
            <TrashIcon />
          </button>
        )}
      </div>

      {post.type === "AUDIO" ? (
        <div className="flex flex-col items-center gap-3 bg-gradient-to-br from-gold-light/40 via-warm to-gold-light/30 px-4 py-6 text-gold-dark">
          <AudioWaveIcon />
          <audio src={post.url} controls className="w-full" />
        </div>
      ) : post.mediaUrls.length > 1 ? (
        <div className="relative">
          <div onScroll={handleCarouselScroll} className="flex snap-x snap-mandatory overflow-x-auto">
            {post.mediaUrls.map((url, i) => (
              <div key={i} className="w-full flex-none snap-center">
                <MediaLightbox url={url} type="PHOTO">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="max-h-[32rem] w-full object-cover" />
                </MediaLightbox>
              </div>
            ))}
          </div>
          <span className="absolute right-3 top-3 rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white">
            {carouselIndex + 1}/{post.mediaUrls.length}
          </span>
        </div>
      ) : (
        <MediaLightbox url={post.url} type={post.type}>
          {post.type === "VIDEO" ? (
            <video src={post.url} muted loop playsInline className="max-h-[32rem] w-full bg-black object-contain" />
          ) : (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={post.url} alt="" className="max-h-[32rem] w-full object-cover" />
          )}
        </MediaLightbox>
      )}

      <div className="px-3.5 py-2.5">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={handleLike}
            disabled={isPending}
            className={`flex items-center gap-1.5 text-sm font-medium ${liked ? "text-danger" : "text-ink-muted"}`}
          >
            <span key={pulseKey} aria-hidden className="inline-block animate-[likePulse_0.35s_ease]">
              {liked ? "♥" : "♡"}
            </span>
            {likeCount}
          </button>
          <button
            type="button"
            onClick={() => setShowAllComments((prev) => !prev)}
            className="flex items-center gap-1.5 text-sm font-medium text-ink-muted"
          >
            <CommentIcon />
            {comments.length}
          </button>
          {shareSupported && (
            <button type="button" onClick={handleShare} aria-label={t("share")} className="text-ink-muted">
              <ShareIcon />
            </button>
          )}
          <a href={post.url} download aria-label={t("download")} className="ml-auto text-gold-dark">
            <BookmarkIcon />
          </a>
        </div>

        {post.caption && <p className="mt-2 text-sm text-ink">{post.caption}</p>}

        {comments.length > 0 && (
          <div className="mt-2 space-y-1">
            {(showAllComments ? comments : comments.slice(0, COMMENT_PREVIEW_COUNT)).map((comment) => (
              <p key={comment.id} className="text-sm text-ink">
                <span className="font-medium">{comment.authorName}</span>{" "}
                <span className="text-ink-muted">{comment.body}</span>
              </p>
            ))}
            {comments.length > COMMENT_PREVIEW_COUNT && (
              <button
                type="button"
                onClick={() => setShowAllComments((prev) => !prev)}
                className="text-xs text-ink-muted hover:underline"
              >
                {showAllComments ? t("showLessComments") : t("viewAllComments", { count: comments.length })}
              </button>
            )}
          </div>
        )}

        <form onSubmit={handleComment} className="mt-3 flex items-center gap-2 border-t border-gold/15 pt-2">
          <input
            value={commentText}
            onChange={(e) => setCommentText(e.target.value)}
            placeholder={t("commentPlaceholder")}
            className="flex-1 rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
          />
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-xs font-medium text-white"
          >
            {t("send")}
          </button>
        </form>
      </div>
    </div>
  );
}
