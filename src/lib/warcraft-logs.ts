interface WCLTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

let cachedToken: { token: string; expiresAt: number } | null = null;

async function getWCLToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const clientId = process.env.WCL_CLIENT_ID;
  const clientSecret = process.env.WCL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing Warcraft Logs API credentials");
  }

  const response = await fetch("https://www.warcraftlogs.com/oauth/token", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString("base64")}`,
    },
    body: "grant_type=client_credentials",
  });

  if (!response.ok) {
    throw new Error(`Failed to get WCL token: ${response.status}`);
  }

  const data: WCLTokenResponse = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return cachedToken.token;
}

export async function wclGraphQL<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const token = await getWCLToken();

  const response = await fetch("https://www.warcraftlogs.com/api/v2/client", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`WCL API error: ${response.status}`);
  }

  const json = await response.json();
  if (json.errors) {
    throw new Error(`WCL GraphQL error: ${JSON.stringify(json.errors)}`);
  }

  return json.data as T;
}

// Types for WCL responses
export interface WCLReportData {
  reportData: {
    report: {
      title: string;
      startTime: number;
      endTime: number;
      zone: { name: string } | null;
      fights: {
        id: number;
        name: string;
        encounterID: number;
        difficulty: number;
        kill: boolean;
        startTime: number;
        endTime: number;
      }[];
      masterData: {
        actors: {
          id: number;
          name: string;
          type: string;
          subType: string;
          server: string;
        }[];
      };
      rankings: {
        data: {
          fightID: number;
          encounter: { id: number; name: string };
          difficulty: number;
          size: number;
          duration: number;
          roles: {
            tanks: { characters: WCLRankedCharacter[] };
            healers: { characters: WCLRankedCharacter[] };
            dps: { characters: WCLRankedCharacter[] };
          };
        }[];
      } | null;
    };
  };
}

export interface WCLRankedCharacter {
  id: number;
  name: string;
  server: { name: string };
  class: string;
  spec: string;
  amount: number; // DPS or HPS
  rankPercent: number;
  bracketPercent: number;
  deaths: number;
}

const REPORT_QUERY = `
  query GetReport($code: String!) {
    reportData {
      report(code: $code) {
        title
        startTime
        endTime
        zone { name }
        fights(killType: Kills) {
          id
          name
          encounterID
          difficulty
          kill
          startTime
          endTime
        }
        masterData {
          actors(type: "Player") {
            id
            name
            type
            subType
            server
          }
        }
      }
    }
  }
`;

const RANKINGS_QUERY = `
  query GetReportRankings($code: String!) {
    reportData {
      report(code: $code) {
        rankings(compare: Rankings)
      }
    }
  }
`;

export async function fetchReportMetadata(code: string) {
  return wclGraphQL<WCLReportData>(REPORT_QUERY, { code });
}

export async function fetchReportRankings(code: string) {
  return wclGraphQL<WCLReportData>(RANKINGS_QUERY, { code });
}
