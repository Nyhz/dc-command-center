import NextAuth from "next-auth";
import BattleNet, { type BattleNetIssuer } from "next-auth/providers/battlenet";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import type { GuildRole } from "@prisma/client";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      battleTag?: string | null;
      guildRole: GuildRole;
    };
  }

  interface User {
    battleTag?: string | null;
    guildRole?: GuildRole;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    BattleNet({
      issuer: process.env.BATTLENET_ISSUER as BattleNetIssuer,
      clientId: process.env.BATTLENET_CLIENT_ID,
      clientSecret: process.env.BATTLENET_CLIENT_SECRET,
      checks: ["state"],
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const isProtected = ["/dashboard", "/roster", "/wishlist", "/calendar", "/logs"].some(
        (path) => request.nextUrl.pathname.startsWith(path)
      );

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl.origin));
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.guildRole = (user as { guildRole: GuildRole }).guildRole ?? "MEMBER";
        session.user.battleTag = (user as { battleTag?: string }).battleTag ?? null;
      }
      return session;
    },
  },
});
