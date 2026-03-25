import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import type { Guild, GuildMember } from "@prisma/client";
import type { Session } from "next-auth";

export interface GuildContext {
  guild: Guild;
  membership: GuildMember;
  session: Session;
}

/**
 * Resolve guild from slug and validate user membership.
 * For use in server components.
 */
export async function resolveGuild(
  guildSlug: string,
  userId: string
): Promise<{ guild: Guild; membership: GuildMember } | null> {
  const guild = await prisma.guild.findUnique({ where: { slug: guildSlug } });
  if (!guild) return null;

  const membership = await prisma.guildMember.findUnique({
    where: { userId_guildId: { userId, guildId: guild.id } },
  });
  if (!membership) return null;

  return { guild, membership };
}

/**
 * Resolve guild from API route params. Returns guild context or error response.
 * For use in API route handlers.
 */
export async function resolveGuildFromParams(
  params: Promise<{ guildSlug: string }>
): Promise<
  | { ok: true; guild: Guild; membership: GuildMember; session: Session }
  | { ok: false; response: NextResponse }
> {
  const session = await auth();
  if (!session?.user) {
    return { ok: false, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const { guildSlug } = await params;
  const result = await resolveGuild(guildSlug, session.user.id);

  if (!result) {
    return { ok: false, response: NextResponse.json({ error: "Guild not found or not a member" }, { status: 403 }) };
  }

  return { ok: true, ...result, session };
}

/**
 * Generate a URL-friendly slug from guild name, realm, and region.
 */
export function generateGuildSlug(name: string, realm: string, region: string): string {
  const slug = `${name}-${realm}-${region}`
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  return slug;
}
