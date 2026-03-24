import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ eventId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { eventId } = await params;
  const body = await request.json();
  const { characterId, status, note } = body;

  if (!characterId || !status) {
    return NextResponse.json({ error: "Missing characterId or status" }, { status: 400 });
  }

  // Verify the character belongs to the user
  const character = await prisma.character.findUnique({
    where: { id: characterId },
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
