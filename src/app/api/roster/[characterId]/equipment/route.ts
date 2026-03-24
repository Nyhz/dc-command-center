import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { fetchCharacterEquipment, fetchCharacterMedia } from "@/lib/blizzard";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ characterId: string }> }
) {
  const session = await auth();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { characterId } = await params;

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    select: { name: true, realm: true, region: true },
  });

  if (!character) {
    return NextResponse.json({ error: "Character not found" }, { status: 404 });
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
        (a) => a.key === "main" || a.key === "main-raw"
      );
      renderUrl = mainRender?.value ?? null;
    }

    return NextResponse.json({ equipped_items: equippedItems, renderUrl });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
