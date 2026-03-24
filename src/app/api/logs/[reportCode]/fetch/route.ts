import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isRaidLeader } from "@/lib/auth-helpers";
import { fetchReportMetadata, fetchReportRankings, type WCLRankedCharacter } from "@/lib/warcraft-logs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ reportCode: string }> }
) {
  const session = await auth();
  if (!session || !isRaidLeader(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { reportCode } = await params;

  const log = await prisma.raidLog.findUnique({ where: { reportCode } });
  if (!log) {
    return NextResponse.json({ error: "Log not found" }, { status: 404 });
  }

  // Fetch report metadata
  const metadata = await fetchReportMetadata(reportCode);
  const report = metadata.reportData.report;

  // Update log with metadata
  await prisma.raidLog.update({
    where: { reportCode },
    data: {
      title: report.title,
      raidName: report.zone?.name ?? null,
      startTime: new Date(report.startTime),
      endTime: new Date(report.endTime),
      fetchedAt: new Date(),
    },
  });

  // Fetch rankings
  const rankingsData = await fetchReportRankings(reportCode);
  const rankings = rankingsData.reportData.report.rankings;

  if (!rankings?.data) {
    return NextResponse.json({ fetched: 0, message: "No rankings data available" });
  }

  // Get all characters in the database for matching
  const allCharacters = await prisma.character.findMany({
    select: { id: true, name: true, realm: true },
  });

  let performancesCreated = 0;

  for (const fight of rankings.data) {
    const allChars: (WCLRankedCharacter & { role: "dps" | "healer" | "tank" })[] = [
      ...(fight.roles.dps?.characters ?? []).map((c) => ({ ...c, role: "dps" as const })),
      ...(fight.roles.healers?.characters ?? []).map((c) => ({ ...c, role: "healer" as const })),
      ...(fight.roles.tanks?.characters ?? []).map((c) => ({ ...c, role: "tank" as const })),
    ];

    for (const wclChar of allChars) {
      // Match WCL character to database character by name (case-insensitive)
      const dbChar = allCharacters.find(
        (c) => c.name.toLowerCase() === wclChar.name.toLowerCase()
      );

      if (!dbChar) continue;

      await prisma.performance.upsert({
        where: {
          characterId_raidLogId_encounterId: {
            characterId: dbChar.id,
            raidLogId: log.id,
            encounterId: fight.encounter.id,
          },
        },
        update: {
          encounterName: fight.encounter.name,
          difficulty: fight.difficulty,
          dps: wclChar.role === "dps" || wclChar.role === "tank" ? wclChar.amount : null,
          hps: wclChar.role === "healer" ? wclChar.amount : null,
          deaths: wclChar.deaths,
          rankPercent: wclChar.rankPercent,
          duration: fight.duration,
          spec: wclChar.spec,
        },
        create: {
          characterId: dbChar.id,
          raidLogId: log.id,
          encounterName: fight.encounter.name,
          encounterId: fight.encounter.id,
          difficulty: fight.difficulty,
          dps: wclChar.role === "dps" || wclChar.role === "tank" ? wclChar.amount : null,
          hps: wclChar.role === "healer" ? wclChar.amount : null,
          deaths: wclChar.deaths,
          rankPercent: wclChar.rankPercent,
          duration: fight.duration,
          spec: wclChar.spec,
        },
      });

      performancesCreated++;
    }
  }

  return NextResponse.json({
    fetched: performancesCreated,
    fights: rankings.data.length,
  });
}
