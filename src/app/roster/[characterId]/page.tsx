import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ClassIcon } from "@/components/shared/class-icon";
import { RoleBadge } from "@/components/shared/role-badge";
import { CLASS_COLORS } from "@/lib/constants";
import { Scroll, BarChart3, CalendarDays } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function CharacterDetailPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      user: { select: { name: true, battleTag: true } },
      wishlistItems: { where: { obtained: false }, orderBy: { priority: "asc" }, take: 5 },
      performances: {
        orderBy: { createdAt: "desc" },
        take: 10,
        include: { raidLog: { select: { reportCode: true, title: true } } },
      },
      attendances: {
        orderBy: { raidEvent: { startTime: "desc" } },
        take: 10,
        include: { raidEvent: { select: { id: true, title: true, startTime: true, raidName: true } } },
      },
    },
  });

  if (!character) notFound();

  const classColor = CLASS_COLORS[character.className] ?? "#FFFFFF";

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      {/* Character header */}
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-16 w-16 items-center justify-center rounded-full border-2 border-border" style={{ borderColor: classColor }}>
          <ClassIcon className={character.className} />
        </div>
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide" style={{ color: classColor }}>
            {character.name}
          </h1>
          <div className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
            <span>{character.specName && `${character.specName} `}{character.className}</span>
            <RoleBadge role={character.raidRole} />
            {character.itemLevel > 0 && (
              <Badge variant="outline" className="font-mono">iLvl {character.itemLevel}</Badge>
            )}
          </div>
          <div className="mt-1 text-xs text-muted-foreground">
            {character.realm} &middot; {character.user?.battleTag ?? character.user?.name ?? "Unlinked"}
            {character.isMain && <Badge variant="outline" className="ml-2 text-xs">Main</Badge>}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="wishlist">
        <TabsList>
          <TabsTrigger value="wishlist" className="gap-1">
            <Scroll className="h-3 w-3" /> Wishlist
          </TabsTrigger>
          <TabsTrigger value="performance" className="gap-1">
            <BarChart3 className="h-3 w-3" /> Performance
          </TabsTrigger>
          <TabsTrigger value="attendance" className="gap-1">
            <CalendarDays className="h-3 w-3" /> Attendance
          </TabsTrigger>
        </TabsList>

        <TabsContent value="wishlist" className="mt-4">
          {character.wishlistItems.length === 0 ? (
            <Card>
              <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
                No active wishlist items.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {character.wishlistItems.map((item) => (
                <Card key={item.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <span className="font-medium text-primary">{item.itemName}</span>
                      {item.sourceBoss && (
                        <span className="ml-2 text-xs text-muted-foreground">from {item.sourceBoss}</span>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {item.priority === 1 ? "BiS" : item.priority === 2 ? "Upgrade" : "Minor"}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
              <Link
                href={`/wishlist/${characterId}`}
                className="block text-center text-sm text-primary hover:underline"
              >
                View full wishlist
              </Link>
            </div>
          )}
        </TabsContent>

        <TabsContent value="performance" className="mt-4">
          {character.performances.length === 0 ? (
            <Card>
              <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
                No performance data recorded yet.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {character.performances.map((perf) => (
                <Card key={perf.id}>
                  <CardContent className="flex items-center justify-between py-3">
                    <div>
                      <Link
                        href={`/logs/${perf.raidLog.reportCode}`}
                        className="font-medium hover:text-primary"
                      >
                        {perf.encounterName}
                      </Link>
                      <span className="ml-2 text-xs text-muted-foreground">
                        {perf.raidLog.title}
                      </span>
                    </div>
                    <div className="flex items-center gap-3 text-sm">
                      {perf.dps !== null && (
                        <span className="font-mono">{(perf.dps / 1000).toFixed(1)}K DPS</span>
                      )}
                      {perf.hps !== null && (
                        <span className="font-mono">{(perf.hps / 1000).toFixed(1)}K HPS</span>
                      )}
                      {perf.rankPercent !== null && (
                        <Badge variant="outline" className="font-mono text-xs">
                          {Math.round(perf.rankPercent)}%
                        </Badge>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="attendance" className="mt-4">
          {character.attendances.length === 0 ? (
            <Card>
              <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
                No attendance records.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-2">
              {character.attendances.map((att) => {
                const statusColors: Record<string, string> = {
                  ATTENDING: "text-green-400",
                  ABSENT: "text-red-400",
                  TENTATIVE: "text-yellow-400",
                };
                return (
                  <Card key={att.id}>
                    <CardContent className="flex items-center justify-between py-3">
                      <Link
                        href={`/calendar/${att.raidEvent.id}`}
                        className="hover:text-primary"
                      >
                        <span className="font-medium">{att.raidEvent.title}</span>
                        <span className="ml-2 text-xs text-muted-foreground">
                          {att.raidEvent.raidName}
                        </span>
                      </Link>
                      <span className={`text-sm font-medium ${statusColors[att.status] ?? ""}`}>
                        {att.status.charAt(0) + att.status.slice(1).toLowerCase()}
                      </span>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
