import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild } = ctx;

  const { searchParams } = new URL(request.url);
  const month = searchParams.get("month"); // YYYY-MM format

  const where: Record<string, unknown> = { guildId: guild.id };
  if (month) {
    const start = new Date(`${month}-01T00:00:00Z`);
    const end = new Date(start);
    end.setMonth(end.getMonth() + 1);
    where.startTime = { gte: start, lt: end };
  }

  const events = await prisma.raidEvent.findMany({
    where,
    include: {
      attendances: {
        include: {
          character: { select: { id: true, name: true, className: true, raidRole: true } },
        },
      },
    },
    orderBy: { startTime: "asc" },
  });

  return NextResponse.json(events);
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

  const body = await request.json();
  const { title, description, raidName, difficulty, startTime, endTime } = body;

  if (!title || !raidName || !startTime || !endTime) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const event = await prisma.raidEvent.create({
    data: {
      title,
      description,
      raidName,
      difficulty: difficulty ?? "Heroic",
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdById: session.user.id,
      guildId: guild.id,
    },
  });

  return NextResponse.json(event, { status: 201 });
}
