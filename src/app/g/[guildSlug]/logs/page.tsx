import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { resolveGuild } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { LinkLogDialog } from "@/components/logs/link-log-dialog";
import Link from "next/link";
import { ExternalLink, BarChart3 } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GuildLogsPage({
  params,
}: {
  params: Promise<{ guildSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { guildSlug } = await params;
  const ctx = await resolveGuild(guildSlug, session.user.id);
  if (!ctx) redirect("/guilds");

  const { guild, membership } = ctx;
  const canManage = isRaidLeader(membership);
  const base = `/g/${guild.slug}`;

  const logs = await prisma.raidLog.findMany({
    where: { guildId: guild.id },
    include: {
      raidEvent: { select: { id: true, title: true } },
      performances: {
        select: { encounterId: true, difficulty: true },
        distinct: ["encounterId", "difficulty"],
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
            Combat Logs
          </h1>
          <p className="mt-1 text-muted-foreground">
            Warcraft Logs reports and performance data
          </p>
        </div>
        {canManage && <LinkLogDialog />}
      </div>

      {logs.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            No logs linked yet. Raid leaders can link Warcraft Logs reports.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <Link key={log.id} href={`${base}/logs/${log.reportCode}`}>
              <Card className="transition-colors hover:border-primary/50 hover:bg-accent/50">
                <CardContent className="flex items-center justify-between py-4">
                  <div className="flex items-center gap-4">
                    <BarChart3 className="h-5 w-5 text-primary" />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">
                          {log.title ?? log.reportCode}
                        </span>
                        {log.raidName && (
                          <Badge variant="outline" className="text-xs">
                            {log.raidName}
                          </Badge>
                        )}
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        {log.startTime && (
                          <span>{format(new Date(log.startTime), "MMM d, yyyy")}</span>
                        )}
                        <span>{log.performances.length} boss kills</span>
                        {!log.fetchedAt && (
                          <Badge variant="outline" className="text-xs text-yellow-400 border-yellow-400/30">
                            Not fetched
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
