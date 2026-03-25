import { auth } from "@/auth";
import { resolveGuild } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { RaidCalendar } from "@/components/calendar/raid-calendar";
import { CreateEventDialog } from "@/components/calendar/create-event-dialog";

export const dynamic = "force-dynamic";

export default async function GuildCalendarPage({
  params,
}: {
  params: Promise<{ guildSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { guildSlug } = await params;
  const ctx = await resolveGuild(guildSlug, session.user.id);
  if (!ctx) redirect("/guilds");

  const { membership } = ctx;
  const canManage = isRaidLeader(membership);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
            Raid Calendar
          </h1>
          <p className="mt-1 text-muted-foreground">
            Scheduled raids and attendance tracking
          </p>
        </div>
        {canManage && <CreateEventDialog />}
      </div>

      <RaidCalendar />
    </div>
  );
}
