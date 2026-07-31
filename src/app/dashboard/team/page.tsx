import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { hasFeature } from "@/lib/features";
import { inviteTeamMember, removeTeamMember } from "@/lib/actions/team";

export default async function TeamPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }
  if (!hasFeature(session.user.accountType, "team_accounts") || session.user.teamRole === "COLLABORATOR") {
    notFound();
  }
  const t = await getTranslations("teamPage");

  const ROLE_LABELS: Record<string, string> = {
    ADMIN: t("roleAdmin"),
    COLLABORATOR: t("roleCollaborator"),
  };

  const teamMembers = await prisma.teamMember.findMany({
    where: { organizerId: session.user.id },
    orderBy: { createdAt: "asc" },
  });

  return (
    <div className="mx-auto w-full max-w-2xl px-4 py-10">
      <Link href="/dashboard" className="text-sm text-gold-dark hover:underline">
        {t("backToEvents")}
      </Link>

      <h1 className="mt-2 font-serif text-2xl font-medium text-ink">{t("title")}</h1>
      <p className="mt-1 text-sm text-ink-muted">{t("subtitle")}</p>

      <section className="mt-6 space-y-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-md backdrop-blur-xl">
        <p className="font-medium text-ink">{t("inviteMember")}</p>
        <form action={inviteTeamMember} className="space-y-2">
          <div>
            <label className="block text-xs font-medium mb-1">{t("name")}</label>
            <input name="name" required className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("email")}</label>
            <input
              name="email"
              type="email"
              required
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("password")}</label>
            <input
              name="password"
              type="password"
              required
              minLength={8}
              className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm"
            />
          </div>
          <div>
            <label className="block text-xs font-medium mb-1">{t("role")}</label>
            <select name="role" defaultValue="COLLABORATOR" className="w-full rounded-lg border border-gold/25 px-2 py-1.5 text-sm">
              <option value="ADMIN">{t("roleAdmin")}</option>
              <option value="COLLABORATOR">{t("roleCollaborator")}</option>
            </select>
          </div>
          <button
            type="submit"
            className="rounded-lg bg-gradient-to-br from-gold-dark to-gold-deep px-4 py-1.5 text-sm font-medium text-white hover:shadow-lg"
          >
            {t("invite")}
          </button>
        </form>
      </section>

      <section className="mt-8">
        <h2 className="mb-3 font-serif text-lg font-medium text-ink">
          {t("members", { count: teamMembers.length })}
        </h2>
        {teamMembers.length === 0 ? (
          <p className="text-sm text-ink-muted">{t("noMembers")}</p>
        ) : (
          <div className="space-y-2">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-gold/20 bg-white/60 p-4 shadow-sm backdrop-blur-xl"
              >
                <div>
                  <p className="font-medium text-ink">{member.name}</p>
                  <p className="text-xs text-ink-muted">
                    {member.email} · {ROLE_LABELS[member.role]}
                  </p>
                </div>
                <form action={removeTeamMember.bind(null, member.id)}>
                  <button type="submit" className="text-sm text-danger hover:underline">
                    {t("delete")}
                  </button>
                </form>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
