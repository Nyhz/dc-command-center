import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isOwner } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild } = ctx;

  const { characterId } = await params;

  // Ensure character belongs to this guild
  const character = await prisma.character.findFirst({
    where: { id: characterId, guildId: guild.id },
  });
  if (!character) {
    return NextResponse.json({ error: "Character not found in this guild" }, { status: 404 });
  }

  const items = await prisma.wishlistItem.findMany({
    where: { characterId },
    orderBy: { priority: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, session } = ctx;

  const { characterId } = await params;

  // Verify ownership and guild membership
  const character = await prisma.character.findFirst({
    where: { id: characterId, guildId: guild.id },
  });
  if (!character || !isOwner(session, character.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { itemId, itemName, itemIcon, itemSlot, itemLevel, sourceBoss, sourceRaid, priority, note } = body;

  if (!itemId || !itemName) {
    return NextResponse.json({ error: "Missing itemId or itemName" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.upsert({
    where: { characterId_itemId: { characterId, itemId } },
    update: { itemName, itemIcon, itemSlot, itemLevel, sourceBoss, sourceRaid, priority, note },
    create: {
      characterId,
      itemId,
      itemName,
      itemIcon,
      itemSlot,
      itemLevel,
      sourceBoss,
      sourceRaid,
      priority: priority ?? 0,
      note,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
