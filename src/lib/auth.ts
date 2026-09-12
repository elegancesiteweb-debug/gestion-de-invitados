import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut, unstable_update } = NextAuth({
  trustHost: true,
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials) => {
        const email = credentials?.email as string | undefined;
        const password = credentials?.password as string | undefined;
        if (!email || !password) return null;

        const organizer = await prisma.organizer.findUnique({ where: { email } });
        if (organizer) {
          if (!organizer.passwordHash) return null;
          const isValid = await bcrypt.compare(password, organizer.passwordHash);
          if (!isValid) return null;

          return {
            id: organizer.id,
            name: organizer.name,
            email: organizer.email,
            accountType: organizer.accountType,
            isAdmin: organizer.isAdmin,
            teamRole: "OWNER",
            teamMemberName: null,
          };
        }

        const teamMember = await prisma.teamMember.findUnique({ where: { email } });
        if (!teamMember) return null;

        const isValid = await bcrypt.compare(password, teamMember.passwordHash);
        if (!isValid) return null;

        const owner = await prisma.organizer.findUniqueOrThrow({
          where: { id: teamMember.organizerId },
        });

        return {
          id: owner.id,
          name: owner.name,
          email: owner.email,
          accountType: owner.accountType,
          isAdmin: false,
          teamRole: teamMember.role,
          teamMemberName: teamMember.name,
        };
      },
    }),
    // Acceso permanente para cuentas Particulares creadas por el admin (sin
    // correo/contraseña): la clave en sí es la credencial, reutilizable
    // siempre — no hay redención de un solo uso como con AccessCode.
    Credentials({
      id: "access-code",
      name: "Clave de acceso",
      credentials: {
        code: { label: "Clave", type: "text" },
      },
      authorize: async (credentials) => {
        const code = (credentials?.code as string | undefined)?.trim().toUpperCase();
        if (!code) return null;

        const organizer = await prisma.organizer.findUnique({ where: { loginCode: code } });
        if (!organizer) return null;

        return {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          accountType: organizer.accountType,
          isAdmin: organizer.isAdmin,
          teamRole: "OWNER",
          teamMemberName: null,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user, trigger, session }) {
      if (user) {
        token.id = user.id;
        token.accountType = (user as { accountType: string }).accountType;
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin;
        token.teamRole = (user as { teamRole: string }).teamRole;
        token.teamMemberName = (user as { teamMemberName: string | null }).teamMemberName;
      }

      if (trigger === "update" && session) {
        const data = session as {
          impersonateOrganizerId?: string;
          impersonateName?: string;
          impersonateAccountType?: "INDIVIDUAL" | "PLANNER";
          stopImpersonation?: boolean;
        };

        // Un admin real "entra como" un cliente Particular: guarda su identidad real y la
        // pisa temporalmente con la del cliente — así todas las verificaciones de dueño ya
        // existentes en el resto de la app (organizerId === session.user.id) funcionan solas.
        if (data.impersonateOrganizerId && token.isAdmin) {
          token.realAdminId = token.id;
          token.realAdminName = token.name;
          token.realAdminAccountType = token.accountType;
          token.id = data.impersonateOrganizerId;
          token.name = data.impersonateName;
          token.accountType = data.impersonateAccountType;
          token.isAdmin = false;
          token.teamRole = "OWNER";
          token.teamMemberName = null;
          token.impersonating = true;
          token.impersonatedName = data.impersonateName;
        }

        if (data.stopImpersonation && token.realAdminId) {
          token.id = token.realAdminId as string;
          token.name = token.realAdminName as string | null | undefined;
          token.accountType = token.realAdminAccountType as "INDIVIDUAL" | "PLANNER";
          token.isAdmin = true;
          token.teamRole = "OWNER";
          token.teamMemberName = null;
          token.impersonating = false;
          token.impersonatedName = null;
          delete token.realAdminId;
          delete token.realAdminName;
          delete token.realAdminAccountType;
        }
      }

      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as "INDIVIDUAL" | "PLANNER";
        session.user.isAdmin = token.isAdmin as boolean;
        session.user.teamRole = token.teamRole as "OWNER" | "ADMIN" | "COLLABORATOR";
        session.user.teamMemberName = token.teamMemberName as string | null;
        session.user.impersonating = token.impersonating as boolean | undefined;
        session.user.impersonatedName = token.impersonatedName as string | null | undefined;
      }
      return session;
    },
  },
});
