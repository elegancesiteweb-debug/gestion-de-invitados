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
        if (!organizer) return null;

        const isValid = await bcrypt.compare(password, organizer.passwordHash);
        if (!isValid) return null;

        return {
          id: organizer.id,
          name: organizer.name,
          email: organizer.email,
          accountType: organizer.accountType,
          isAdmin: organizer.isAdmin,
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
      }
      return token;
    },
    session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.accountType = token.accountType as "INDIVIDUAL" | "PLANNER";
        session.user.isAdmin = token.isAdmin as boolean;
      }
      return session;
    },
  },
});
