import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isOwner } from "@/lib/auth-helpers";

async function verifyOwnership(session: { user: { id: string } }, characterId: string) {
  const character = await prisma.character.findUnique({ where: { id: characterId } });
  return character && isOwner(session as Parameters<typeof isOwner>[0], character.userId);
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ characterId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId, itemId } = await params;
  if (!(await verifyOwnership(session, characterId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();

  const item = await prisma.wishlistItem.update({
    where: { id: itemId },
    data: {
      ...(body.priority !== undefined && { priority: body.priority }),
      ...(body.note !== undefined && { note: body.note }),
      ...(body.obtained !== undefined && { obtained: body.obtained }),
    },
  });

  return NextResponse.json(item);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ characterId: string; itemId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId, itemId } = await params;
  if (!(await verifyOwnership(session, characterId))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.wishlistItem.delete({ where: { id: itemId } });

  return NextResponse.json({ ok: true });
}
