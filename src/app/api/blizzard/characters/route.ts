import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get the user's Battle.net account with stored access token
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      provider: "battlenet",
    },
    select: { access_token: true },
  });

  if (!account?.access_token) {
    return NextResponse.json(
      { error: "No Battle.net account linked or token expired" },
      { status: 404 }
    );
  }

  // Default to US region; could be parameterized in the future
  const region = "us";

  try {
    const response = await fetch(
      `https://${region}.api.blizzard.com/profile/user/wow?namespace=profile-${region}&locale=en_US`,
      {
        headers: {
          Authorization: `Bearer ${account.access_token}`,
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[Blizzard API] Failed to fetch user characters:", response.status, errorText);
      return NextResponse.json(
        { error: "Failed to fetch characters from Blizzard" },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Flatten the nested structure into a simple character list
    const characters: Array<{
      name: string;
      realm: string;
      realmSlug: string;
      level: number;
      className: string;
      faction: string;
      id: number;
    }> = [];

    for (const wowAccount of data.wow_accounts ?? []) {
      for (const char of wowAccount.characters ?? []) {
        characters.push({
          name: char.name,
          realm: char.realm?.name ?? "",
          realmSlug: char.realm?.slug ?? "",
          level: char.level ?? 0,
          className: char.playable_class?.name ?? "",
          faction: char.faction?.name ?? "",
          id: char.id,
        });
      }
    }

    // Sort by level descending so max-level characters appear first
    characters.sort((a, b) => b.level - a.level);

    return NextResponse.json(characters);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("[Blizzard API] Error fetching user characters:", message);
    return NextResponse.json({ error: message }, { status: 502 });
  }
}
