import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { generateGuildSlug } from "@/lib/guild-helpers";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const memberships = await prisma.guildMember.findMany({
    where: { userId: session.user.id },
    include: {
      guild: { select: { id: true, name: true, slug: true, realm: true, region: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  return NextResponse.json(memberships);
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { name, realm, region } = body;

  if (!name || !realm) {
    return NextResponse.json({ error: "Missing name or realm" }, { status: 400 });
  }

  const slug = generateGuildSlug(name, realm, region ?? "eu");

  // Check slug uniqueness
  const existing = await prisma.guild.findUnique({ where: { slug } });
  if (existing) {
    return NextResponse.json({ error: "A guild with this name/realm already exists" }, { status: 409 });
  }

  const guild = await prisma.guild.create({
    data: {
      name,
      realm: realm.toLowerCase().replace(/ /g, "-"),
      region: region ?? "eu",
      slug,
      members: {
        create: {
          userId: session.user.id,
          role: "GUILD_MASTER",
        },
      },
    },
  });

  return NextResponse.json(guild, { status: 201 });
}
