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
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const members = await prisma.guildMember.findMany({
    where: { guildId: guild.id },
    include: {
      user: { select: { id: true, name: true, battleTag: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(members);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { membership } = ctx;

  // Only GM can change roles
  if (membership.role !== "GUILD_MASTER") {
    return NextResponse.json({ error: "Only the Guild Master can change roles" }, { status: 403 });
  }

  const body = await request.json();
  const { memberId, role } = body;

  if (!memberId || !role) {
    return NextResponse.json({ error: "Missing memberId or role" }, { status: 400 });
  }

  const validRoles = ["RAID_LEADER", "OFFICER", "MEMBER"];
  if (!validRoles.includes(role)) {
    return NextResponse.json({ error: "Invalid role" }, { status: 400 });
  }

  const updated = await prisma.guildMember.update({
    where: { id: memberId },
    data: { role },
  });

  return NextResponse.json(updated);
}
