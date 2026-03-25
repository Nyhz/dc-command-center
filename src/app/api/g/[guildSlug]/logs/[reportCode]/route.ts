import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; reportCode: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild } = ctx;

  const { reportCode } = await params;

  const log = await prisma.raidLog.findUnique({
    where: { reportCode_guildId: { reportCode, guildId: guild.id } },
    include: {
      performances: {
        include: {
          character: {
            select: { id: true, name: true, className: true, specName: true, raidRole: true },
          },
        },
        orderBy: [{ encounterName: "asc" }, { dps: "desc" }],
      },
    },
  });

  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  return NextResponse.json(log);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; reportCode: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportCode } = await params;

  const log = await prisma.raidLog.findUnique({
    where: { reportCode_guildId: { reportCode, guildId: guild.id } },
  });
  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  await prisma.raidLog.delete({ where: { id: log.id } });

  return NextResponse.json({ ok: true });
}
