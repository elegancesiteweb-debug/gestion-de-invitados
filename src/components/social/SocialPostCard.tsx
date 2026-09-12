"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toggleLike, createComment } from "@/lib/actions/socialPortal";

type Comment = { id: string; body: string; authorName: string };

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
    <div className="overflow-hidden rounded-2xl border border-gold/20 bg-white shadow-md shadow-gold/5">
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-gold via-gold-dark to-gold-deep text-xs font-semibold text-white shadow-sm">
          {post.authorName.charAt(0).toUpperCase()}
        </span>
        <span className="text-sm font-medium text-ink">{post.authorName}</span>
      </div>

      {post.type === "VIDEO" ? (
        <video src={post.url} controls className="max-h-[32rem] w-full bg-black object-contain" />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={post.url} alt="" className="max-h-[32rem] w-full object-cover" />
      )}

      <div className="px-3 py-2">
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
            className="text-sm text-ink-muted"
          >
            {t("commentsCount", { count: comments.length })}
          </button>
          <a
            href={post.url}
            download
            className="ml-auto text-sm text-gold-dark hover:underline"
          >
            {t("download")}
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
