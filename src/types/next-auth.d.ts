import type { DefaultSession } from "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      accountType: "INDIVIDUAL" | "PLANNER";
      isAdmin: boolean;
    } & DefaultSession["user"];
  }
}
