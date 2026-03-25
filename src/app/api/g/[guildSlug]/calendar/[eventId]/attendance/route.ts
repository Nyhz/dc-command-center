import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ guildSlug: string; eventId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, session } = ctx;

  const { eventId } = await params;
  const body = await request.json();
  const { characterId, status, note } = body;

  if (!characterId || !status) {
    return NextResponse.json({ error: "Missing characterId or status" }, { status: 400 });
  }

  // Verify the event belongs to this guild
  const event = await prisma.raidEvent.findFirst({
    where: { id: eventId, guildId: guild.id },
  });
  if (!event) {
    return NextResponse.json({ error: "Event not found in this guild" }, { status: 404 });
  }

  // Verify the character belongs to the user and this guild
  const character = await prisma.character.findFirst({
    where: { id: characterId, guildId: guild.id },
  });

  if (!character || character.userId !== session.user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const attendance = await prisma.attendance.upsert({
    where: {
      characterId_raidEventId: { characterId, raidEventId: eventId },
    },
    update: { status, note },
    create: { characterId, raidEventId: eventId, status, note },
  });

  return NextResponse.json(attendance);
}
