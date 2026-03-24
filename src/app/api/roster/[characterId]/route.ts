import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { characterId } = await params;
  const body = await request.json();

  const character = await prisma.character.update({
    where: { id: characterId },
    data: {
      ...(body.specName !== undefined && { specName: body.specName }),
      ...(body.raidRole !== undefined && { raidRole: body.raidRole }),
      ...(body.itemLevel !== undefined && { itemLevel: body.itemLevel }),
      ...(body.isMain !== undefined && { isMain: body.isMain }),
      ...(body.className !== undefined && { className: body.className }),
    },
  });

  return NextResponse.json(character);
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { characterId } = await params;
  await prisma.character.delete({ where: { id: characterId } });

  return NextResponse.json({ ok: true });
}
