import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";

export async function GET() {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const characters = await prisma.character.findMany({
    include: { user: { select: { id: true, name: true, battleTag: true } } },
    orderBy: [{ className: "asc" }, { name: "asc" }],
  });

  return NextResponse.json(characters);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, realm, region, className, specName, raidRole, itemLevel, isMain } = body;

  if (!name || !realm || !className) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Regular members can only add characters for themselves
  // RL/GM can add for anyone (by providing userId)
  const userId = isRaidLeader(session) && body.userId ? body.userId : session.user.id;

  const character = await prisma.character.upsert({
    where: {
      name_realm_region: { name, realm, region: region ?? "us" },
    },
    update: { className, specName, raidRole, itemLevel, isMain, userId },
    create: {
      name,
      realm,
      region: region ?? "us",
      className,
      specName,
      raidRole: raidRole ?? "DPS",
      itemLevel: itemLevel ?? 0,
      isMain: isMain ?? false,
      userId,
    },
  });

  return NextResponse.json(character, { status: 201 });
}
