import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { prisma } from "@/lib/prisma";
import { getPublicUrl } from "@/lib/r2";
import { identifyGuest, getSocialIdentity } from "@/lib/actions/socialPortal";
import { SocialFeed } from "@/components/social/SocialFeed";

export default async function SocialWallPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const t = await getTranslations("socialPage");

  const event = await prisma.event.findUnique({ where: { socialToken: token } });
  if (!event) {
    notFound();
  }

  const identity = await getSocialIdentity(event.id);

  if (!identity) {
    const guests = await prisma.guest.findMany({
      where: { eventId: event.id },
      include: { companions: true },
      orderBy: { name: "asc" },
    });

    return (
      <div className="mx-auto w-full max-w-md px-4 py-16">
        <div className="rounded-2xl border border-gold/20 bg-white/60 p-6 shadow-lg backdrop-blur-xl">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/logo.png" alt="" className="mx-auto h-14 w-14" />
          <p className="mt-3 text-center text-xs uppercase tracking-[0.2em] text-gold-dark">
            {t("title")}
          </p>
          <h1 className="mt-1 text-center font-serif text-xl font-medium text-ink">
            {event.title}
          </h1>
          <p className="mt-4 text-center text-sm text-ink-muted">{t("whoAreYou")}</p>

          <form action={identifyGuest.bind(null, token)} className="mt-4 space-y-3">
            {guests.length > 0 && (
              <select
                name="pickedId"
                defaultValue=""
                className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
              >
                <option value="">{t("chooseFromList")}</option>
                {guests.map((guest) => (
                  <optgroup key={guest.id} label={guest.name}>
                    <option value={`guest:${guest.id}`}>{guest.name}</option>
                    {guest.companions.map((companion) => (
                      <option key={companion.id} value={`companion:${companion.id}`}>
                        {companion.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
            )}
            <div>
              <label className="mb-1 block text-xs text-ink-muted">{t("notInListLabel")}</label>
              <input
                name="customName"
                placeholder={t("customNamePlaceholder")}
                className="w-full rounded-lg border border-gold/25 px-3 py-2 text-sm"
              />
            </div>
            <button
              type="submit"
              className="w-full rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-2.5 text-sm font-medium text-white shadow-md hover:shadow-lg"
            >
              {t("enter")}
            </button>
          </form>
        </div>
      </div>
    );
  }

  const storiesActiveSince = new Date();
  storiesActiveSince.setDate(storiesActiveSince.getDate() - 1);

  const [posts, stories] = await Promise.all([
    prisma.socialPost.findMany({
      where: { eventId: event.id },
      include: {
        identity: { select: { displayName: true } },
        likes: { select: { identityId: true } },
        comments: {
          include: { identity: { select: { displayName: true } } },
          orderBy: { createdAt: "asc" },
        },
      },
      orderBy: { createdAt: "desc" },
    }),
    prisma.socialStory.findMany({
      where: { eventId: event.id, createdAt: { gt: storiesActiveSince } },
      include: { identity: { select: { displayName: true } } },
      orderBy: { createdAt: "desc" },
    }),
  ]);

  const feedPosts = posts.map((post) => ({
    id: post.id,
    type: post.type,
    url: getPublicUrl(post.storageKey),
    caption: post.caption,
    authorName: post.identity.displayName,
    createdAt: post.createdAt.toISOString(),
    likeCount: post.likes.length,
    likedByMe: post.likes.some((like) => like.identityId === identity.id),
    comments: post.comments.map((comment) => ({
      id: comment.id,
      body: comment.body,
      authorName: comment.identity.displayName,
    })),
  }));

  const feedStories = stories.map((story) => ({
    id: story.id,
    type: story.type,
    url: getPublicUrl(story.storageKey),
    authorName: story.identity.displayName,
  }));

  return (
    <SocialFeed
      token={token}
      eventTitle={event.title}
      myName={identity.displayName}
      posts={feedPosts}
      stories={feedStories}
    />
  );
}
