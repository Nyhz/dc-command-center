import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isRaidLeader } from "@/lib/auth-helpers";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { RefetchButton } from "@/components/logs/refetch-button";
import { DeleteLogButton } from "@/components/logs/delete-log-button";
import { LogPerformanceView } from "@/components/logs/log-performance-view";
import { Badge } from "@/components/ui/badge";
import { ExternalLink } from "lucide-react";

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
        orderBy: [{ difficulty: "desc" }, { encounterName: "asc" }, { dps: "desc" }],
      },
    },
  });

  if (!log) notFound();

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
          {canManage && <DeleteLogButton reportCode={reportCode} title={log.title ?? reportCode} />}
        </div>
        <p className="text-muted-foreground">
          {log.startTime && format(new Date(log.startTime), "EEEE, MMM d, yyyy")}
          {log.startTime && log.endTime && (
            <> &middot; {format(new Date(log.startTime), "h:mm a")} - {format(new Date(log.endTime), "h:mm a")}</>
          )}
          <span> &middot; {new Set(log.performances.map((p) => `${p.encounterId}-${p.difficulty}`)).size} boss kills</span>
        </p>
      </div>

      <LogPerformanceView performances={log.performances} />
    </div>
  );
}
