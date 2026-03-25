import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isOwner } from "@/lib/auth-helpers";

async function verifyOwnership(
  session: { user: { id: string } },
  characterId: string,
  guildId: string
) {
  const character = await prisma.character.findFirst({
    where: { id: characterId, guildId },
  });
  return character && isOwner(session as Parameters<typeof isOwner>[0], character.userId);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string; itemId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, session } = ctx;

  const { characterId, itemId } = await params;
  if (!(await verifyOwnership(session, characterId, guild.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const item = await prisma.wishlistItem.update({
    where: { id: itemId },
    data: {
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.note !== undefined && { note: body.note }),
      ...(body.obtained !== undefined && { obtained: body.obtained }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string; itemId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, session } = ctx;

  const { characterId, itemId } = await params;
  if (!(await verifyOwnership(session, characterId, guild.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.wishlistItem.delete({ where: { id: itemId } });

  return NextResponse.json({ ok: true });
}
