import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { format } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { RoleBadge } from "@/components/shared/role-badge";
import { ClassIcon } from "@/components/shared/class-icon";
import { CLASS_COLORS } from "@/lib/constants";
import { AttendanceToggle } from "@/components/calendar/attendance-toggle";

export const dynamic = "force-dynamic";

export default async function EventDetailPage({
  params,
}: {
  params: Promise<{ eventId: string }>;
}) {
  const { eventId } = await params;
  const session = await auth();

  const event = await prisma.raidEvent.findUnique({
    where: { id: eventId },
    include: {
      attendances: {
        include: {
          character: {
            select: {
              id: true,
              name: true,
              className: true,
              specName: true,
              raidRole: true,
              userId: true,
            },
          },
        },
      },
    },
  });

  if (!event) notFound();

  // Get user's characters for the attendance toggle
  const userCharacters = session
    ? await prisma.character.findMany({
        where: { userId: session.user.id },
        select: { id: true, name: true, className: true, raidRole: true },
      })
    : [];

  const attending = event.attendances.filter((a) => a.status === "ATTENDING");
  const absent = event.attendances.filter((a) => a.status === "ABSENT");
  const tentative = event.attendances.filter((a) => a.status === "TENTATIVE");

  const tanks = attending.filter((a) => a.character.raidRole === "TANK");
  const healers = attending.filter((a) => a.character.raidRole === "HEALER");
  const dps = attending.filter((a) => a.character.raidRole === "DPS");

  const difficultyColors: Record<string, string> = {
    Mythic: "bg-purple-600/20 text-purple-400 border-purple-600/30",
    Heroic: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    Normal: "bg-green-600/20 text-green-400 border-green-600/30",
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
            {event.title}
          </h1>
          <Badge
            variant="outline"
            className={difficultyColors[event.difficulty] ?? ""}
          >
            {event.difficulty}
          </Badge>
        </div>
        <p className="text-muted-foreground">
          {event.raidName} &middot;{" "}
          {format(new Date(event.startTime), "EEEE, MMM d, yyyy")} &middot;{" "}
          {format(new Date(event.startTime), "h:mm a")} -{" "}
          {format(new Date(event.endTime), "h:mm a")}
        </p>
        {event.description && (
          <p className="mt-2 text-sm text-muted-foreground">{event.description}</p>
        )}
      </div>

      {/* Attendance toggle for current user */}
      {userCharacters.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-base">Your Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <AttendanceToggle
              eventId={event.id}
              characters={userCharacters}
              existingAttendances={event.attendances
                .filter((a) => userCharacters.some((c) => c.id === a.character.id))
                .map((a) => ({
                  characterId: a.character.id,
                  status: a.status,
                  note: a.note,
                }))}
            />
          </CardContent>
        </Card>
      )}

      {/* Composition summary */}
      <div className="mb-6 flex gap-4 text-sm">
        <span className="text-blue-400">{tanks.length} Tanks</span>
        <span className="text-green-400">{healers.length} Healers</span>
        <span className="text-red-400">{dps.length} DPS</span>
        <span className="text-muted-foreground">
          ({attending.length} total, {tentative.length} tentative, {absent.length} absent)
        </span>
      </div>

      <Separator className="mb-6" />

      {/* Attending by role */}
      <div className="grid gap-6 md:grid-cols-3">
        {[
          { title: "Tanks", list: tanks },
          { title: "Healers", list: healers },
          { title: "DPS", list: dps },
        ].map(({ title, list }) => (
          <Card key={title}>
            <CardHeader>
              <CardTitle className="text-sm">{title} ({list.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {list.length === 0 ? (
                <p className="text-xs text-muted-foreground">None signed up</p>
              ) : (
                list.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <ClassIcon className={a.character.className} />
                    <span style={{ color: CLASS_COLORS[a.character.className] }}>
                      {a.character.name}
                    </span>
                    {a.character.specName && (
                      <span className="text-xs text-muted-foreground">
                        {a.character.specName}
                      </span>
                    )}
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Tentative & Absent */}
      {(tentative.length > 0 || absent.length > 0) && (
        <div className="mt-6 grid gap-6 md:grid-cols-2">
          {tentative.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-yellow-400">Tentative ({tentative.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {tentative.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <ClassIcon className={a.character.className} />
                    <span style={{ color: CLASS_COLORS[a.character.className] }}>
                      {a.character.name}
                    </span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
          {absent.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm text-red-400">Absent ({absent.length})</CardTitle>
              </CardHeader>
              <CardContent className="space-y-1">
                {absent.map((a) => (
                  <div key={a.id} className="flex items-center gap-2 text-sm">
                    <ClassIcon className={a.character.className} />
                    <span className="text-muted-foreground">{a.character.name}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
