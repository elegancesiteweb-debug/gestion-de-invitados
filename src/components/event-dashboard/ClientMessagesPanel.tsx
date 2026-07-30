import type { ClientComment } from "@prisma/client";
import { formatDateTime } from "@/lib/dates";

export function ClientMessagesPanel({ comments }: { comments: ClientComment[] }) {
  return (
    <div className="space-y-3 py-6">
      <h2 className="font-serif text-lg font-medium text-ink">Mensajes del cliente</h2>
      {comments.length === 0 ? (
        <p className="text-sm text-ink-muted">
          Todavía no hay mensajes desde el portal del cliente.
        </p>
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
