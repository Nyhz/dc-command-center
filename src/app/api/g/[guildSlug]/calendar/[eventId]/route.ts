import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string; eventId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;
  const body = await request.json();

  // Ensure event belongs to this guild
  const existing = await prisma.raidEvent.findFirst({
    where: { id: eventId, guildId: guild.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Event not found in this guild" }, { status: 404 });
  }

  const event = await prisma.raidEvent.update({
    where: { id: eventId },
    data: {
      ...(body.title !== undefined && { title: body.title }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.raidName !== undefined && { raidName: body.raidName }),
      ...(body.difficulty !== undefined && { difficulty: body.difficulty }),
      ...(body.startTime !== undefined && { startTime: new Date(body.startTime) }),
      ...(body.endTime !== undefined && { endTime: new Date(body.endTime) }),
    },
  });

  return NextResponse.json(event);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; eventId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { eventId } = await params;

  // Ensure event belongs to this guild
  const existing = await prisma.raidEvent.findFirst({
    where: { id: eventId, guildId: guild.id },
  });
  if (!existing) {
    return NextResponse.json({ error: "Event not found in this guild" }, { status: 404 });
  }

  await prisma.raidEvent.delete({ where: { id: eventId } });

  return NextResponse.json({ ok: true });
}
