import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";
import { nanoid } from "nanoid";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const invites = await prisma.guildInvite.findMany({
    where: { guildId: guild.id },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(invites);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership, session } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => ({}));
  const { expiresInHours, maxUses } = body as { expiresInHours?: number; maxUses?: number };

  const code = nanoid(12);

  let expiresAt: Date | null = null;
  if (expiresInHours && expiresInHours > 0) {
    expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);
  }

  const invite = await prisma.guildInvite.create({
    data: {
      guildId: guild.id,
      code,
      createdBy: session.user.id,
      expiresAt,
      maxUses: maxUses ?? null,
    },
  });

  return NextResponse.json(invite, { status: 201 });
}
