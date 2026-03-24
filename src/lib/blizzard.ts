interface BlizzardTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getBlizzardToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.BLIZZARD_CLIENT_ID;
  const clientSecret = process.env.BLIZZARD_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Blizzard API credentials");
  }

  const response = await fetch("https://oauth.battle.net/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Failed to get Blizzard token: ${response.status}`);
  }

  const data: BlizzardTokenResponse = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export interface BlizzardGuildRosterMember {
  character: {
    name: string;
    id: number;
    realm: { slug: string; name: string };
    level: number;
    playable_class: { id: number; name: string };
    playable_race: { id: number; name: string };
  };
  rank: number;
}

export interface BlizzardCharacterProfile {
  name: string;
  id: number;
  level: number;
  race: { name: string };
  character_class: { name: string };
  active_spec?: { name: string };
  realm: { slug: string; name: string };
  guild?: { name: string };
  equipped_item_level?: number;
  average_item_level?: number;
}

export async function fetchGuildRoster(
  realmSlug: string,
  guildName: string,
  region: string = "us"
): Promise<BlizzardGuildRosterMember[]> {
  const token = await getBlizzardToken();
  const encodedGuild = encodeURIComponent(guildName.toLowerCase().replace(/ /g, "-"));

  const response = await fetch(
    `https://${region}.api.blizzard.com/data/wow/guild/${realmSlug}/${encodedGuild}/roster?namespace=profile-${region}&locale=en_US`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch guild roster: ${response.status}`);
  }

  const data = await response.json();
  return data.members ?? [];
}

export async function fetchCharacterProfile(
  realmSlug: string,
  characterName: string,
  region: string = "us"
): Promise<BlizzardCharacterProfile> {
  const token = await getBlizzardToken();
  const encodedName = encodeURIComponent(characterName.toLowerCase());

  const response = await fetch(
    `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${encodedName}?namespace=profile-${region}&locale=en_US`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch character profile: ${response.status}`);
  }

  return response.json();
}

export interface BlizzardCharacterMedia {
  assets: { key: string; value: string }[];
}

export async function fetchCharacterMedia(
  realmSlug: string,
  characterName: string,
  region: string = "eu"
): Promise<BlizzardCharacterMedia> {
  const token = await getBlizzardToken();
  const encodedName = encodeURIComponent(characterName.toLowerCase());

  const response = await fetch(
    `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${encodedName}/character-media?namespace=profile-${region}&locale=en_US`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch character media: ${response.status}`);
  }

  return response.json();
}

export interface BlizzardEquippedItem {
  slot: { type: string; name: string };
  item: { id: number; name: string };
  name: string;
  quality: { type: string; name: string };
  level: { value: number };
  enchantments?: { display_string: string }[];
  sockets?: { item?: { id: number; name: string }; display_string: string }[];
  set?: { item_set: { name: string } };
  transmog?: { item: { name: string } };
}

export interface BlizzardEquipmentResponse {
  equipped_items: BlizzardEquippedItem[];
}

export async function fetchCharacterEquipment(
  realmSlug: string,
  characterName: string,
  region: string = "eu"
): Promise<BlizzardEquipmentResponse> {
  const token = await getBlizzardToken();
  const encodedName = encodeURIComponent(characterName.toLowerCase());

  const response = await fetch(
    `https://${region}.api.blizzard.com/profile/wow/character/${realmSlug}/${encodedName}/equipment?namespace=profile-${region}&locale=en_US`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to fetch character equipment: ${response.status}`);
  }

  return response.json();
}

export async function searchItems(
  query: string,
  region: string = "us"
): Promise<{ id: number; name: string }[]> {
  const token = await getBlizzardToken();

  const response = await fetch(
    `https://${region}.api.blizzard.com/data/wow/search/item?namespace=static-${region}&name.en_US=${encodeURIComponent(query)}&orderby=id&_pageSize=25`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  if (!response.ok) {
    throw new Error(`Failed to search items: ${response.status}`);
  }

  const data = await response.json();
  return (data.results ?? []).map((r: { data: { id: number; name: { en_US: string } } }) => ({
    id: r.data.id,
    name: r.data.name.en_US,
  }));
}
