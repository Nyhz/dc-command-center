import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild } = ctx;

  const items = await prisma.wishlistItem.findMany({
    where: {
      character: { guildId: guild.id },
    },
    include: {
      character: {
        select: { id: true, name: true, className: true, raidRole: true, userId: true },
      },
    },
    orderBy: [{ sourceRaid: "asc" }, { sourceBoss: "asc" }, { priority: "asc" }],
  });

  return NextResponse.json(items);
}
