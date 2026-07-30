import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";

export const { handlers, auth, signIn, signOut } = NextAuth({
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
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.accountType = (user as { accountType: string }).accountType;
        token.isAdmin = (user as { isAdmin: boolean }).isAdmin;
        token.teamRole = (user as { teamRole: string }).teamRole;
        token.teamMemberName = (user as { teamMemberName: string | null }).teamMemberName;
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
      }
      return session;
    },
  },
});
