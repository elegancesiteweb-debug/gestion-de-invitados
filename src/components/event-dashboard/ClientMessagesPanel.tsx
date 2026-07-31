import type { ClientComment } from "@prisma/client";
import { getTranslations } from "next-intl/server";
import { formatDateTime } from "@/lib/dates";

export async function ClientMessagesPanel({ comments }: { comments: ClientComment[] }) {
  const t = await getTranslations("clientMessages");
  return (
    <div className="space-y-3 py-6">
      <h2 className="font-serif text-lg font-medium text-ink">{t("title")}</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted">{t("empty")}</p>
      ) : (
        <ul className="space-y-2">
          {comments.map((comment) => (
            <li
              key={comment.id}
              className="rounded-lg border border-gold/20 bg-white/60 p-3 text-sm shadow-sm backdrop-blur-xl"
            >
              <p className="text-ink">{comment.body}</p>
              <p className="mt-1 text-xs text-ink-muted">{formatDateTime(comment.createdAt)}</p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
