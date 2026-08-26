import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: "INDIVIDUAL" | "PLANNER";
      isAdmin: boolean;
      teamRole: "OWNER" | "ADMIN" | "COLLABORATOR";
      teamMemberName: string | null;
      // Presente solo mientras un admin "entra como" un cliente Particular
      // (ver src/lib/actions/admin.ts → impersonateOrganizer/stopImpersonation).
      impersonating?: boolean;
      impersonatedName?: string | null;
    } & DefaultSession["user"];
  }
}
