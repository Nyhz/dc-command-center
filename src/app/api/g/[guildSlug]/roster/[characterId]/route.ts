import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { characterId } = await params;
  const body = await request.json();

  // Ensure character belongs to this guild
  const existing = await prisma.character.findFirst({
    where: { id: characterId, guildId: guild.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Character not found in this guild" }, { status: 404 });
  }

  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      ...(body.specName !== undefined && { specName: body.specName }),
      ...(body.raidRole !== undefined && { raidRole: body.raidRole }),
      ...(body.itemLevel !== undefined && { itemLevel: body.itemLevel }),
      ...(body.isMain !== undefined && { isMain: body.isMain }),
      ...(body.className !== undefined && { className: body.className }),
    },
  });

  return NextResponse.json(character);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { characterId } = await params;

  // Ensure character belongs to this guild
  const existing = await prisma.character.findFirst({
    where: { id: characterId, guildId: guild.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Character not found in this guild" }, { status: 404 });
  }

  await prisma.character.delete({ where: { id: characterId } });

  return NextResponse.json({ ok: true });
}
