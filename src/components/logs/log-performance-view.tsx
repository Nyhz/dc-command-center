"use client";

import { useState } from "react";
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
import { ChevronDown, ChevronRight } from "lucide-react";

interface PerformanceData {
  id: string;
  encounterName: string;
  encounterId: number;
  difficulty: number;
  dps: number | null;
  hps: number | null;
  deaths: number;
  rankPercent: number | null;
  duration: number | null;
  spec: string | null;
  character: {
    id: string;
    name: string;
    className: string;
    specName: string | null;
    raidRole: string;
  };
}

const difficultyMap: Record<number, string> = {
  3: "Normal",
  4: "Heroic",
  5: "Mythic",
};

const difficultyColors: Record<number, string> = {
  3: "bg-green-600/20 text-green-400 border-green-600/30",
  4: "bg-amber-600/20 text-amber-400 border-amber-600/30",
  5: "bg-purple-600/20 text-purple-400 border-purple-600/30",
};

const difficultyOrder = [5, 4, 3]; // Mythic first, then Heroic, then Normal

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

function EncounterTable({ encounter, perfs }: { encounter: string; perfs: PerformanceData[] }) {
  const duration = perfs[0]?.duration;
  const dpsPlayers = perfs.filter((p) => p.dps !== null).sort((a, b) => (b.dps ?? 0) - (a.dps ?? 0));
  const hpsPlayers = perfs.filter((p) => p.hps !== null).sort((a, b) => (b.hps ?? 0) - (a.hps ?? 0));

  return (
    <Card>
      <CardHeader className="py-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{encounter}</CardTitle>
          {duration && (
            <span className="text-xs text-muted-foreground">
              {Math.floor(duration / 60000)}:{String(Math.floor((duration % 60000) / 1000)).padStart(2, "0")}
            </span>
          )}
        </div>
      </CardHeader>
      <CardContent className="pt-0">
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
}

function DifficultySection({ difficulty, performances }: { difficulty: number; performances: PerformanceData[] }) {
  const [expanded, setExpanded] = useState(true);
  const label = difficultyMap[difficulty] ?? `Difficulty ${difficulty}`;
  const colorClass = difficultyColors[difficulty] ?? "";

  // Group by encounter within this difficulty
  const byEncounter = new Map<string, PerformanceData[]>();
  for (const perf of performances) {
    if (!byEncounter.has(perf.encounterName)) byEncounter.set(perf.encounterName, []);
    byEncounter.get(perf.encounterName)!.push(perf);
  }

  const bossCount = byEncounter.size;

  return (
    <div>
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-3 w-full py-3 px-1 text-left hover:bg-accent/30 rounded-md transition-colors"
      >
        {expanded ? (
          <ChevronDown className="h-5 w-5 text-muted-foreground" />
        ) : (
          <ChevronRight className="h-5 w-5 text-muted-foreground" />
        )}
        <Badge variant="outline" className={`text-sm px-3 py-0.5 ${colorClass}`}>
          {label}
        </Badge>
        <span className="text-sm text-muted-foreground">
          {bossCount} boss{bossCount !== 1 ? "es" : ""}
        </span>
      </button>

      {expanded && (
        <div className="space-y-4 ml-8 mt-2">
          {Array.from(byEncounter.entries()).map(([encounter, perfs]) => (
            <EncounterTable key={encounter} encounter={encounter} perfs={perfs} />
          ))}
        </div>
      )}
    </div>
  );
}

export function LogPerformanceView({ performances }: { performances: PerformanceData[] }) {
  // Group by difficulty
  const byDifficulty = new Map<number, PerformanceData[]>();
  for (const perf of performances) {
    if (!byDifficulty.has(perf.difficulty)) byDifficulty.set(perf.difficulty, []);
    byDifficulty.get(perf.difficulty)!.push(perf);
  }

  // Sort difficulties: Mythic → Heroic → Normal
  const sortedDifficulties = [...byDifficulty.keys()].sort(
    (a, b) => difficultyOrder.indexOf(a) - difficultyOrder.indexOf(b)
  );

  if (performances.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
          No performance data yet. Click &quot;Re-fetch&quot; to import from Warcraft Logs.
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {sortedDifficulties.map((diff) => (
        <DifficultySection
          key={diff}
          difficulty={diff}
          performances={byDifficulty.get(diff)!}
        />
      ))}
    </div>
  );
}
