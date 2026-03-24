import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isRaidLeader } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { RefetchButton } from "@/components/logs/refetch-button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ClassIcon } from "@/components/shared/class-icon";
import { CLASS_COLORS } from "@/lib/constants";
import { ExternalLink } from "lucide-react";

function percentileColor(pct: number | null): string {
  if (pct === null) return "text-muted-foreground";
  if (pct >= 95) return "text-orange-400";
  if (pct >= 75) return "text-purple-400";
  if (pct >= 50) return "text-blue-400";
  if (pct >= 25) return "text-green-400";
  return "text-gray-400";
}

function formatNumber(n: number | null): string {
  if (n === null) return "—";
  if (n >= 1000000) return `${(n / 1000000).toFixed(2)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}K`;
  return n.toFixed(1);
}

export const dynamic = "force-dynamic";

export default async function LogDetailPage({
  params,
}: {
  params: Promise<{ reportCode: string }>;
}) {
  const { reportCode } = await params;
  const session = await auth();
  const canManage = isRaidLeader(session);

  const log = await prisma.raidLog.findUnique({
    where: { reportCode },
    include: {
      performances: {
        include: {
          character: {
            select: { id: true, name: true, className: true, specName: true, raidRole: true },
          },
        },
        orderBy: [{ encounterName: "asc" }, { dps: "desc" }],
      },
    },
  });

  if (!log) notFound();

  // Group performances by encounter
  const byEncounter = new Map<string, typeof log.performances>();
  for (const perf of log.performances) {
    const key = perf.encounterName;
    if (!byEncounter.has(key)) byEncounter.set(key, []);
    byEncounter.get(key)!.push(perf);
  }

  const difficultyMap: Record<number, string> = {
    3: "Normal",
    4: "Heroic",
    5: "Mythic",
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
            {log.title ?? log.reportCode}
          </h1>
          {log.raidName && (
            <Badge variant="outline">{log.raidName}</Badge>
          )}
          <a
            href={`https://www.warcraftlogs.com/reports/${reportCode}`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary"
          >
            <ExternalLink className="h-4 w-4" />
          </a>
          {canManage && <RefetchButton reportCode={reportCode} />}
        </div>
        <p className="text-muted-foreground">
          {log.startTime && format(new Date(log.startTime), "EEEE, MMM d, yyyy")}
          {log.startTime && log.endTime && (
            <> &middot; {format(new Date(log.startTime), "h:mm a")} - {format(new Date(log.endTime), "h:mm a")}</>
          )}
          <span> &middot; {byEncounter.size} bosses &middot; {log.performances.length} performance records</span>
        </p>
      </div>

      {byEncounter.size === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            No performance data yet. Click &quot;Fetch Data&quot; from the logs list to import from Warcraft Logs.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byEncounter.entries()).map(([encounter, perfs]) => {
            const difficulty = perfs[0]?.difficulty;
            const duration = perfs[0]?.duration;

            // Sort: DPS by dps desc, healers by hps desc
            const dpsPlayers = perfs.filter((p) => p.dps !== null).sort((a, b) => (b.dps ?? 0) - (a.dps ?? 0));
            const hpsPlayers = perfs.filter((p) => p.hps !== null).sort((a, b) => (b.hps ?? 0) - (a.hps ?? 0));

            return (
              <Card key={encounter}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <CardTitle className="font-heading text-lg">{encounter}</CardTitle>
                      {difficulty && (
                        <Badge variant="outline" className="text-xs">
                          {difficultyMap[difficulty] ?? `Diff ${difficulty}`}
                        </Badge>
                      )}
                    </div>
                    {duration && (
                      <span className="text-xs text-muted-foreground">
                        {Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, "0")}
                      </span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {dpsPlayers.length > 0 && (
                    <div className="mb-4">
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Damage</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Spec</TableHead>
                            <TableHead className="text-right">DPS</TableHead>
                            <TableHead className="text-right">Parse</TableHead>
                            <TableHead className="text-right">Deaths</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {dpsPlayers.map((perf) => (
                            <TableRow key={perf.id}>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <ClassIcon className={perf.character.className} />
                                  <span style={{ color: CLASS_COLORS[perf.character.className] }}>
                                    {perf.character.name}
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {perf.spec ?? perf.character.specName ?? "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(perf.dps)}
                              </TableCell>
                              <TableCell className={`text-right font-mono font-bold ${percentileColor(perf.rankPercent)}`}>
                                {perf.rankPercent !== null ? `${Math.round(perf.rankPercent)}` : "—"}
                              </TableCell>
                              <TableCell className={`text-right ${perf.deaths > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {perf.deaths}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}

                  {hpsPlayers.length > 0 && (
                    <div>
                      <h4 className="mb-2 text-sm font-medium text-muted-foreground">Healing</h4>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Player</TableHead>
                            <TableHead>Spec</TableHead>
                            <TableHead className="text-right">HPS</TableHead>
                            <TableHead className="text-right">Parse</TableHead>
                            <TableHead className="text-right">Deaths</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {hpsPlayers.map((perf) => (
                            <TableRow key={perf.id}>
                              <TableCell>
                                <span className="flex items-center gap-2">
                                  <ClassIcon className={perf.character.className} />
                                  <span style={{ color: CLASS_COLORS[perf.character.className] }}>
                                    {perf.character.name}
                                  </span>
                                </span>
                              </TableCell>
                              <TableCell className="text-muted-foreground text-sm">
                                {perf.spec ?? perf.character.specName ?? "—"}
                              </TableCell>
                              <TableCell className="text-right font-mono">
                                {formatNumber(perf.hps)}
                              </TableCell>
                              <TableCell className={`text-right font-mono font-bold ${percentileColor(perf.rankPercent)}`}>
                                {perf.rankPercent !== null ? `${Math.round(perf.rankPercent)}` : "—"}
                              </TableCell>
                              <TableCell className={`text-right ${perf.deaths > 0 ? "text-destructive" : "text-muted-foreground"}`}>
                                {perf.deaths}
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
