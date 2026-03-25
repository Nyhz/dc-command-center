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

  const logs = await prisma.raidLog.findMany({
    where: { guildId: guild.id },
    include: {
      raidEvent: { select: { id: true, title: true } },
      _count: { select: { performances: true } },
    },
    orderBy: { startTime: "desc" },
  });

  return NextResponse.json(logs);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  let { reportCode } = body;

  if (!reportCode) {
    return NextResponse.json({ error: "Missing reportCode" }, { status: 400 });
  }

  // Extract code from full URL if provided
  const match = reportCode.match(/reports\/([a-zA-Z0-9]+)/);
  if (match) {
    reportCode = match[1];
  }

  // Check if already linked for this guild
  const existing = await prisma.raidLog.findUnique({
    where: { reportCode_guildId: { reportCode, guildId: guild.id } },
  });
  if (existing) {
    return NextResponse.json({ error: "Report already linked", log: existing }, { status: 409 });
  }

  const log = await prisma.raidLog.create({
    data: {
      reportCode,
      guildId: guild.id,
      raidEventId: body.raidEventId ?? null,
    },
  });

  return NextResponse.json(log, { status: 201 });
}
