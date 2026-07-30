import { redirect } from "next/navigation";
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

  const isCollaborator = session.user.teamRole === "COLLABORATOR";

  const links: SidebarLink[] = [{ href: "/dashboard", label: "Tus eventos" }];
  if (hasFeature(session.user.accountType, "vendor_directory")) {
    links.push({ href: "/dashboard/vendors", label: "Proveedores" });
  }
  if (hasFeature(session.user.accountType, "crm_leads")) {
    links.push({ href: "/dashboard/leads", label: "Leads" });
  }
  if (hasFeature(session.user.accountType, "business_reports")) {
    links.push({ href: "/dashboard/reports", label: "Reportes" });
  }
  if (hasFeature(session.user.accountType, "team_accounts") && !isCollaborator) {
    links.push({ href: "/dashboard/team", label: "Equipo" });
  }
  if (!isCollaborator) {
    links.push({ href: "/dashboard/settings", label: "Configuración" });
  }
  if (session.user.isAdmin) {
    links.push({ href: "/dashboard/admin", label: "Admin" });
  }

  return (
    <div className="flex flex-col md:flex-row">
      <DashboardSidebar
        links={links}
        userName={session.user.name ?? ""}
        teamMemberName={session.user.teamMemberName}
        isCollaborator={isCollaborator}
      />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}
