import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { resolveGuild } from "@/lib/guild-helpers";
import { isRaidLeader } from "@/lib/auth-helpers";
import { redirect } from "next/navigation";
import { RosterTable } from "@/components/roster/roster-table";
import { AddCharacterDialog } from "@/components/roster/add-character-dialog";
import { SyncRosterButton } from "@/components/roster/sync-roster-dialog";

export const dynamic = "force-dynamic";

export default async function GuildRosterPage({
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

  const characters = await prisma.character.findMany({
    where: { guildId: guild.id },
    include: { user: { select: { id: true, name: true, battleTag: true } } },
    orderBy: [{ className: "asc" }, { name: "asc" }],
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
            Guild Roster
          </h1>
          <p className="mt-1 text-muted-foreground">
            All guild members and their characters
          </p>
        </div>
        <div className="flex gap-2">
          {canManage && <SyncRosterButton />}
          <AddCharacterDialog />
        </div>
      </div>

      <RosterTable
        characters={characters}
        canManage={canManage}
        guildSlug={guild.slug}
      />
    </div>
  );
}
