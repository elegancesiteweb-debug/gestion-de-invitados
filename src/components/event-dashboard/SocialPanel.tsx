import { getTranslations } from "next-intl/server";
import type { SocialPost, SocialIdentity } from "@prisma/client";
import { toggleSocialWall, setPostHidden, deleteSocialPost } from "@/lib/actions/social";
import { CopyLinkButton } from "@/components/CopyLinkButton";
import { getPublicUrl } from "@/lib/r2";
import { formatDateTime } from "@/lib/dates";

type PostWithIdentity = SocialPost & { identity: SocialIdentity };

export async function SocialPanel({
  eventId,
  socialToken,
  baseUrl,
  posts,
}: {
  eventId: string;
  socialToken: string | null;
  baseUrl: string;
  posts: PostWithIdentity[];
}) {
  const t = await getTranslations("socialPanel");

  const wallUrl = socialToken ? `${baseUrl}/social/${socialToken}` : null;
  const projectionUrl = socialToken ? `${baseUrl}/social/${socialToken}/projection` : null;

  return (
    <div className="space-y-6 py-6">
      <section className="rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <h2 className="font-serif text-lg font-medium text-ink">{t("title")}</h2>
        <p className="mt-1 text-xs text-ink-muted">{t("hint")}</p>

        <div className="mt-3 flex items-center gap-3">
          {socialToken ? (
            <form action={toggleSocialWall.bind(null, eventId)}>
              <input type="hidden" name="enable" value="false" />
              <button
                type="submit"
                className="rounded-lg border border-danger/30 bg-danger-bg px-3 py-1.5 text-sm text-danger hover:bg-danger-bg/80"
              >
                {t("deactivate")}
              </button>
            </form>
          ) : (
            <form action={toggleSocialWall.bind(null, eventId)}>
              <input type="hidden" name="enable" value="true" />
              <button
                type="submit"
                className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-3 py-1.5 text-sm text-white hover:shadow-lg"
              >
                {t("activate")}
              </button>
            </form>
          )}
        </div>

        {wallUrl && projectionUrl && (
          <div className="mt-4 space-y-2 border-t border-gold/15 pt-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {t("wallLink")}
              </span>
              <CopyLinkButton url={wallUrl} />
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-xs font-medium uppercase tracking-wide text-ink-muted">
                {t("projectionLink")}
              </span>
              <CopyLinkButton url={projectionUrl} />
              <a href={projectionUrl} target="_blank" rel="noopener noreferrer" className="text-sm text-gold-dark hover:underline">
                {t("openProjection")}
              </a>
            </div>
          </div>
        )}
      </section>

      {socialToken && (
        <section>
          <h2 className="mb-3 font-serif text-lg font-medium text-ink">
            {t("postsTitle", { count: posts.length })}
          </h2>
          {posts.length === 0 ? (
            <p className="text-sm text-ink-muted">{t("noPosts")}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {posts.map((post) => (
                <div key={post.id} className="overflow-hidden rounded-lg border border-gold/20 bg-white shadow-sm">
                  {post.type === "VIDEO" ? (
                    <video src={getPublicUrl(post.storageKey)} className="h-32 w-full object-cover" muted />
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={getPublicUrl(post.storageKey)} alt="" className="h-32 w-full object-cover" />
                  )}
                  <div className="p-2">
                    <p className="truncate text-xs font-medium text-ink">{post.identity.displayName}</p>
                    <p className="text-[10px] text-ink-light">{formatDateTime(post.createdAt)}</p>
                    <div className="mt-2 flex items-center justify-between gap-1">
                      <form action={setPostHidden.bind(null, eventId, post.id, !post.hiddenFromProjection)}>
                        <button type="submit" className="text-[11px] text-gold-dark hover:underline">
                          {post.hiddenFromProjection ? t("showInProjection") : t("hideFromProjection")}
                        </button>
                      </form>
                      <form action={deleteSocialPost.bind(null, eventId, post.id)}>
                        <button type="submit" className="text-[11px] text-danger hover:underline">
                          {t("delete")}
                        </button>
                      </form>
                    </div>
                    {post.hiddenFromProjection && (
                      <p className="mt-1 text-[10px] text-warning">{t("hiddenBadge")}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
}
