import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";
import { fetchCharacterProfile } from "@/lib/blizzard";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const characters = await prisma.character.findMany({
    where: { guildId: guild.id },
    select: { id: true, name: true, realm: true, region: true },
  });

  let updated = 0;
  const BATCH_SIZE = 5;

  for (let i = 0; i < characters.length; i += BATCH_SIZE) {
    const batch = characters.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (char) => {
        const profile = await fetchCharacterProfile(char.realm, char.name, char.region);
        await prisma.character.update({
          where: { id: char.id },
          data: {
            specName: profile.active_spec?.name ?? null,
            itemLevel: profile.equipped_item_level ?? profile.average_item_level ?? 0,
            className: profile.character_class?.name ?? undefined,
          },
        });
      })
    );
    updated += results.filter((r) => r.status === "fulfilled").length;
  }

  return NextResponse.json({ updated, total: characters.length });
}
