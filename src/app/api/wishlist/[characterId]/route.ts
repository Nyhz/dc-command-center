import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/auth-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;
  const items = await prisma.wishlistItem.findMany({
    where: { characterId },
    orderBy: { priority: "asc" },
  });

  return NextResponse.json(items);
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  // Verify ownership
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  if (!character || !isOwner(session, character.userId)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { itemId, itemName, itemIcon, itemSlot, itemLevel, sourceBoss, sourceRaid, priority, note } = body;

  if (!itemId || !itemName) {
    return NextResponse.json({ error: "Missing itemId or itemName" }, { status: 400 });
  }

  const item = await prisma.wishlistItem.upsert({
    where: { characterId_itemId: { characterId, itemId } },
    update: { itemName, itemIcon, itemSlot, itemLevel, sourceBoss, sourceRaid, priority, note },
    create: {
      characterId,
      itemId,
      itemName,
      itemIcon,
      itemSlot,
      itemLevel,
      sourceBoss,
      sourceRaid,
      priority: priority ?? 0,
      note,
    },
  });

  return NextResponse.json(item, { status: 201 });
}
