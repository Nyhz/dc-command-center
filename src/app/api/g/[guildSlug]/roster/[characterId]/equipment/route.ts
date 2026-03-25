import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { fetchCharacterEquipment, fetchCharacterMedia } from "@/lib/blizzard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; characterId: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild } = ctx;

  const { characterId } = await params;

  const character = await prisma.character.findFirst({
    where: { id: characterId, guildId: guild.id },
    select: { name: true, realm: true, region: true },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found in this guild" }, { status: 404 });
  }

  try {
    const [equipment, media] = await Promise.allSettled([
      fetchCharacterEquipment(character.realm, character.name, character.region),
      fetchCharacterMedia(character.realm, character.name, character.region),
    ]);

    const equippedItems =
      equipment.status === "fulfilled" ? equipment.value.equipped_items : [];

    let renderUrl: string | null = null;
    if (media.status === "fulfilled") {
      const mainRender = media.value.assets?.find(
        (a: { key: string; value?: string }) => a.key === "main" || a.key === "main-raw"
      );
      renderUrl = mainRender?.value ?? null;
    }

    return NextResponse.json({ equipped_items: equippedItems, renderUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
