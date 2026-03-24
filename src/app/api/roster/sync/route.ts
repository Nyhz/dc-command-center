import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";
import { fetchGuildRoster, fetchCharacterProfile } from "@/lib/blizzard";

export async function POST(request: Request) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json();
  const { realmSlug, guildName, region } = body;

  if (!realmSlug || !guildName) {
    return NextResponse.json({ error: "Missing realmSlug or guildName" }, { status: 400 });
  }

  const members = await fetchGuildRoster(realmSlug, guildName, region ?? "us");

  let synced = 0;
  for (const member of members) {
    const { character } = member;

    // Try to fetch detailed profile for spec and ilvl
    let specName: string | null = null;
    let itemLevel = 0;
    try {
      const profile = await fetchCharacterProfile(
        character.realm.slug,
        character.name,
        region ?? "us"
      );
      specName = profile.active_spec?.name ?? null;
      itemLevel = profile.equipped_item_level ?? profile.average_item_level ?? 0;
    } catch {
      // Profile fetch may fail for low-level or inactive characters
    }

    await prisma.character.upsert({
      where: {
        name_realm_region: {
          name: character.name,
          realm: character.realm.slug,
          region: region ?? "us",
        },
      },
      update: {
        className: character.playable_class.name,
        specName,
        itemLevel,
        guildRank: member.rank,
        blizzardId: character.id,
      },
      create: {
        name: character.name,
        realm: character.realm.slug,
        region: region ?? "us",
        className: character.playable_class.name,
        specName,
        itemLevel,
        guildRank: member.rank,
        blizzardId: character.id,
        userId: session.user.id, // Assign unlinked chars to the syncing user
      },
    });

    synced++;
  }

  return NextResponse.json({ synced, total: members.length });
}
