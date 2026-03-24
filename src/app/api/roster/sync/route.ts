import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";
import { fetchGuildRoster, fetchCharacterProfile } from "@/lib/blizzard";

export const maxDuration = 60; // Allow up to 60s on Vercel Pro, 10s on Hobby

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

  // Step 1: Fetch guild roster (single API call)
  let members;
  try {
    members = await fetchGuildRoster(realmSlug, guildName, region ?? "eu");
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: `Failed to fetch roster: ${message}` }, { status: 502 });
  }

  // Step 2: Upsert all characters from roster (basic info — no profile fetch)
  let synced = 0;
  for (const member of members) {
    const { character } = member;

    await prisma.character.upsert({
      where: {
        name_realm_region: {
          name: character.name,
          realm: character.realm.slug,
          region: region ?? "eu",
        },
      },
      update: {
        className: character.playable_class.name,
        guildRank: member.rank,
        blizzardId: character.id,
      },
      create: {
        name: character.name,
        realm: character.realm.slug,
        region: region ?? "eu",
        className: character.playable_class.name,
        guildRank: member.rank,
        blizzardId: character.id,
        userId: session.user.id,
      },
    });
    synced++;
  }

  // Step 3: Fetch detailed profiles in parallel (batches of 5) for spec + ilvl
  const BATCH_SIZE = 5;
  let profilesUpdated = 0;

  for (let i = 0; i < members.length; i += BATCH_SIZE) {
    const batch = members.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (member) => {
        const { character } = member;
        try {
          const profile = await fetchCharacterProfile(
            character.realm.slug,
            character.name,
            region ?? "eu"
          );
          await prisma.character.update({
            where: {
              name_realm_region: {
                name: character.name,
                realm: character.realm.slug,
                region: region ?? "eu",
              },
            },
            data: {
              specName: profile.active_spec?.name ?? null,
              itemLevel: profile.equipped_item_level ?? profile.average_item_level ?? 0,
            },
          });
          return true;
        } catch {
          return false;
        }
      })
    );

    profilesUpdated += results.filter(
      (r) => r.status === "fulfilled" && r.value === true
    ).length;
  }

  return NextResponse.json({
    synced,
    total: members.length,
    profilesUpdated,
  });
}
