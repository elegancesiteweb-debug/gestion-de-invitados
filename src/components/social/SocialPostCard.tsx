"use client";

import { useState, useSyncExternalStore, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleLike, createComment } from "@/lib/actions/socialPortal";
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

export type FeedPost = {
  id: string;
  type: "PHOTO" | "VIDEO";
  url: string;
  caption: string | null;
  authorName: string;
  createdAt: string;
  likeCount: number;
  likedByMe: boolean;
  comments: Comment[];
};

export function SocialPostCard({ token, post }: { token: string; post: FeedPost }) {
  const t = useTranslations("socialPage");
  const [liked, setLiked] = useState(post.likedByMe);
  const [likeCount, setLikeCount] = useState(post.likeCount);
  const [comments, setComments] = useState(post.comments);
  const [commentText, setCommentText] = useState("");
  const [showComments, setShowComments] = useState(false);
  const [pulseKey, setPulseKey] = useState(0);
  const [isPending, startTransition] = useTransition();
  const shareSupported = useSyncExternalStore(subscribeNoop, getShareSupported, getServerShareSupported);

  async function handleShare() {
    try {
      await navigator.share({ url: post.url, text: post.caption ?? undefined });
    } catch {
      // el usuario canceló el diálogo de compartir — no es un error a mostrar
    }
  }

  function handleLike() {
    setLiked((prev) => !prev);
    setLikeCount((prev) => (liked ? prev - 1 : prev + 1));
    setPulseKey((prev) => prev + 1);
    startTransition(async () => {
      await toggleLike(token, post.id);
    });
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
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-ink">{post.authorName}</p>
          <p className="text-[11px] text-ink-light">{formatDateTime(new Date(post.createdAt))}</p>
        </div>
      </div>

      <MediaLightbox url={post.url} type={post.type}>
        {post.type === "VIDEO" ? (
          <video src={post.url} muted loop playsInline className="max-h-[32rem] w-full bg-black object-contain" />
        ) : (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={post.url} alt="" className="max-h-[32rem] w-full object-cover" />
        )}
      </MediaLightbox>

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
            onClick={() => setShowComments((prev) => !prev)}
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

        {showComments && (
          <div className="mt-3 space-y-2 border-t border-gold/15 pt-2">
            {comments.map((comment) => (
              <p key={comment.id} className="text-sm text-ink">
                <span className="font-medium">{comment.authorName}</span>{" "}
                <span className="text-ink-muted">{comment.body}</span>
              </p>
            ))}
            <form onSubmit={handleComment} className="flex items-center gap-2">
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
        )}
      </div>
    </div>
  );
}
