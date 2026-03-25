import NextAuth from "next-auth";
import BattleNet, { type BattleNetIssuer } from "next-auth/providers/battlenet";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      name?: string | null;
      email?: string | null;
      image?: string | null;
      battleTag?: string | null;
    };
  }

  interface User {
    battleTag?: string | null;
  }
}

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    BattleNet({
      issuer: process.env.BATTLENET_ISSUER as BattleNetIssuer,
      clientId: process.env.BATTLENET_CLIENT_ID,
      clientSecret: process.env.BATTLENET_CLIENT_SECRET,
      checks: ["state", "nonce"],
      authorization: {
        params: {
          scope: "openid wow.profile",
        },
      },
    }),
  ],
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { pathname } = request.nextUrl;
      const isProtected =
        pathname.startsWith("/g/") ||
        pathname.startsWith("/guilds") ||
        pathname.startsWith("/invite");

      if (isProtected && !isLoggedIn) {
        return Response.redirect(new URL("/login", request.nextUrl.origin));
      }

      return true;
    },
    async session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.battleTag = (user as { battleTag?: string }).battleTag ?? null;
      }
      return session;
    },
  },
});
