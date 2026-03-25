import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  const invite = await prisma.guildInvite.findUnique({
    where: { code },
    include: {
      guild: { select: { name: true, realm: true, region: true, slug: true } },
    },
  });

  if (!invite) {
    return NextResponse.json({ valid: false, error: "Invalid invite code" }, { status: 404 });
  }

  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ valid: false, error: "Invite has expired" }, { status: 410 });
  }

  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    return NextResponse.json({ valid: false, error: "Invite has reached maximum uses" }, { status: 410 });
  }

  return NextResponse.json({
    valid: true,
    guild: invite.guild,
  });
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ code: string }> }
) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { code } = await params;

  const invite = await prisma.guildInvite.findUnique({
    where: { code },
    include: { guild: true },
  });

  if (!invite) {
    return NextResponse.json({ error: "Invalid invite code" }, { status: 404 });
  }

  // Check expiry
  if (invite.expiresAt && invite.expiresAt < new Date()) {
    return NextResponse.json({ error: "Invite has expired" }, { status: 410 });
  }

  // Check max uses
  if (invite.maxUses !== null && invite.uses >= invite.maxUses) {
    return NextResponse.json({ error: "Invite has reached maximum uses" }, { status: 410 });
  }

  // Check if already a member
  const existingMembership = await prisma.guildMember.findUnique({
    where: { userId_guildId: { userId: session.user.id, guildId: invite.guildId } },
  });
  if (existingMembership) {
    return NextResponse.json({ error: "Already a member of this guild", guild: invite.guild }, { status: 409 });
  }

  const body = await request.json();
  const { characterName, realm, region, className, specName } = body;

  if (!characterName || !realm || !className) {
    return NextResponse.json({ error: "Missing required character fields (characterName, realm, className)" }, { status: 400 });
  }

  // Create GuildMember + Character in a transaction
  const result = await prisma.$transaction(async (tx) => {
    const membership = await tx.guildMember.create({
      data: {
        userId: session.user.id,
        guildId: invite.guildId,
        role: "MEMBER",
      },
    });

    const character = await tx.character.create({
      data: {
        name: characterName,
        realm,
        region: region ?? "us",
        className,
        specName: specName ?? null,
        raidRole: "DPS",
        isMain: true,
        userId: session.user.id,
        guildId: invite.guildId,
      },
    });

    // Increment invite uses
    await tx.guildInvite.update({
      where: { id: invite.id },
      data: { uses: { increment: 1 } },
    });

    return { membership, character };
  });

  return NextResponse.json({
    guild: invite.guild,
    membership: result.membership,
    character: result.character,
  }, { status: 201 });
}
