import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";
import { auth } from "@/lib/auth";
import { hasFeature } from "@/lib/features";
import { DashboardSidebar, type SidebarLink } from "@/components/DashboardSidebar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const t = await getTranslations("nav");
  const locale = await getLocale();
  const isCollaborator = session.user.teamRole === "COLLABORATOR";

  const links: SidebarLink[] = [{ href: "/dashboard", label: t("yourEvents") }];
  if (hasFeature(session.user.accountType, "vendor_directory")) {
    links.push({ href: "/dashboard/vendors", label: t("vendors") });
  }
  if (hasFeature(session.user.accountType, "crm_leads")) {
    links.push({ href: "/dashboard/leads", label: t("leads") });
  }
  if (hasFeature(session.user.accountType, "business_reports")) {
    links.push({ href: "/dashboard/reports", label: t("reports") });
  }
  if (hasFeature(session.user.accountType, "team_accounts") && !isCollaborator) {
    links.push({ href: "/dashboard/team", label: t("team") });
  }
  if (!isCollaborator) {
    links.push({ href: "/dashboard/settings", label: t("settings") });
  }
  if (session.user.isAdmin) {
    links.push({ href: "/dashboard/admin", label: t("admin") });
  }

  return (
    <div className="flex flex-col md:flex-row">
      <DashboardSidebar
        links={links}
        userName={session.user.name ?? ""}
        teamMemberName={session.user.teamMemberName}
        isCollaborator={isCollaborator}
        currentLocale={locale as "es" | "en"}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
