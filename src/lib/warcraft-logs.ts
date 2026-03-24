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

// ─── Types ───

export interface WCLFight {
  id: number;
  name: string;
  encounterID: number;
  difficulty: number;
  kill: boolean;
  startTime: number;
  endTime: number;
}

export interface WCLTableEntry {
  name: string;
  id: number;
  guid: number;
  type: string;  // "Shaman", "Warrior", etc.
  spec: string;  // "Restoration", "Arms", etc.
  total: number; // total damage or healing
  activeTime: number;
  activeTimeReduced: number;
}

export interface WCLReportMetadata {
  reportData: {
    report: {
      title: string;
      startTime: number;
      endTime: number;
      zone: { name: string } | null;
      fights: WCLFight[];
    };
  };
}

export interface WCLFightTableData {
  reportData: {
    report: {
      damageTable: { data: { entries: WCLTableEntry[] } } | null;
      healingTable: { data: { entries: WCLTableEntry[] } } | null;
    };
  };
}

// ─── Queries ───

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
      }
    }
  }
`;

// Per-fight query using aliases — gets DPS and HPS tables for a single fight
const FIGHT_TABLE_QUERY = `
  query GetFightTable($code: String!, $fightID: [Int]!, $start: Float!, $end: Float!) {
    reportData {
      report(code: $code) {
        damageTable: table(dataType: DamageDone, fightIDs: $fightID, startTime: $start, endTime: $end)
        healingTable: table(dataType: HealingDone, fightIDs: $fightID, startTime: $start, endTime: $end)
      }
    }
  }
`;

// ─── API functions ───

export async function fetchReportMetadata(code: string) {
  return wclGraphQL<WCLReportMetadata>(REPORT_QUERY, { code });
}

export async function fetchFightTable(code: string, fightID: number, startTime: number, endTime: number) {
  return wclGraphQL<WCLFightTableData>(FIGHT_TABLE_QUERY, {
    code,
    fightID: [fightID],
    start: startTime,
    end: endTime,
  });
}
