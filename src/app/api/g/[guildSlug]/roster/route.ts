import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild } = ctx;

  const characters = await prisma.character.findMany({
    where: { guildId: guild.id },
    include: { user: { select: { id: true, name: true, battleTag: true } } },
    orderBy: [{ className: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(characters);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership, session } = ctx;

  const body = await request.json();
  const { name, realm, region, className, specName, raidRole, itemLevel, isMain } = body;

  if (!name || !realm || !className) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Regular members can only add characters for themselves
  // RL/GM can add for anyone (by providing userId)
  const userId = isRaidLeader(membership) && body.userId ? body.userId : session.user.id;

  const character = await prisma.character.upsert({
    where: {
      name_realm_region_guildId: { name, realm, region: region ?? "us", guildId: guild.id },
    },
    update: { className, specName, raidRole, itemLevel, isMain, userId },
    create: {
      name,
      realm,
      region: region ?? "us",
      className,
      specName,
      raidRole: raidRole ?? "DPS",
      itemLevel: itemLevel ?? 0,
      isMain: isMain ?? false,
      userId,
      guildId: guild.id,
    },
  });

  return NextResponse.json(character, { status: 201 });
}
