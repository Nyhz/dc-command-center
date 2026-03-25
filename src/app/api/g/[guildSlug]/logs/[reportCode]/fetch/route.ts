import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { resolveGuildFromParams } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";
import { fetchReportMetadata, fetchFightTable, type WCLTableEntry } from "@/lib/warcraft-logs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ guildSlug: string; reportCode: string }> }
) {
  const ctx = await resolveGuildFromParams(params);
  if (!ctx.ok) return ctx.response;
  const { guild, membership } = ctx;

  if (!isRaidLeader(membership)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportCode } = await params;

  const log = await prisma.raidLog.findUnique({
    where: { reportCode_guildId: { reportCode, guildId: guild.id } },
  });
  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  // Step 1: Fetch report metadata (fights list)
  const metadata = await fetchReportMetadata(reportCode);
  const report = metadata.reportData.report;

  await prisma.raidLog.update({
    where: { id: log.id },
    data: {
      title: report.title,
      raidName: report.zone?.name ?? null,
      startTime: new Date(report.startTime),
      endTime: new Date(report.endTime),
      fetchedAt: new Date(),
    },
  });

  const fights = report.fights.filter((f: { kill: boolean; encounterID: number }) => f.kill && f.encounterID > 0);

  // Step 2: Get only characters in THIS guild for matching
  const allCharacters = await prisma.character.findMany({
    where: { guildId: guild.id },
    select: { id: true, name: true, realm: true },
  });

  let performancesCreated = 0;

  // Step 3: Fetch DPS/HPS table for each fight
  for (const fight of fights) {
    let damageEntries: WCLTableEntry[] = [];
    let healingEntries: WCLTableEntry[] = [];

    try {
      const tableData = await fetchFightTable(
        reportCode,
        fight.id,
        fight.startTime,
        fight.endTime
      );

      damageEntries = tableData.reportData.report.damageTable?.data?.entries ?? [];
      healingEntries = tableData.reportData.report.healingTable?.data?.entries ?? [];
    } catch (err) {
      console.error("[WCL ERROR] Fight fetch failed:", fight.name, err instanceof Error ? err.message : err);
      continue;
    }

    const duration = fight.endTime - fight.startTime;

    // Build a map of player name -> { dps, hps, spec }
    const playerMap = new Map<string, { dps: number | null; hps: number | null; spec: string; className: string }>();

    for (const entry of damageEntries) {
      const dps = duration > 0 ? entry.total / (duration / 1000) : 0;
      playerMap.set(entry.name.toLowerCase(), {
        dps,
        hps: null,
        spec: entry.spec,
        className: entry.type,
      });
    }

    for (const entry of healingEntries) {
      const hps = duration > 0 ? entry.total / (duration / 1000) : 0;
      const existing = playerMap.get(entry.name.toLowerCase());
      if (existing) {
        existing.hps = hps;
      } else {
        playerMap.set(entry.name.toLowerCase(), {
          dps: null,
          hps,
          spec: entry.spec,
          className: entry.type,
        });
      }
    }

    // Match to roster characters in this guild and upsert
    for (const [playerName, data] of playerMap) {
      const dbChar = allCharacters.find(
        (c) => c.name.toLowerCase() === playerName
      );
      if (!dbChar) continue;

      await prisma.performance.upsert({
        where: {
          characterId_raidLogId_encounterId_difficulty: {
            characterId: dbChar.id,
            raidLogId: log.id,
            encounterId: fight.encounterID,
            difficulty: fight.difficulty,
          },
        },
        update: {
          encounterName: fight.name,
          dps: data.dps,
          hps: data.hps,
          deaths: 0,
          rankPercent: null,
          duration,
          spec: data.spec,
        },
        create: {
          characterId: dbChar.id,
          raidLogId: log.id,
          encounterName: fight.name,
          encounterId: fight.encounterID,
          difficulty: fight.difficulty,
          dps: data.dps,
          hps: data.hps,
          deaths: 0,
          rankPercent: null,
          duration,
          spec: data.spec,
        },
      });

      performancesCreated++;
    }
  }

  return NextResponse.json({
    fetched: performancesCreated,
    fights: fights.length,
  });
}
