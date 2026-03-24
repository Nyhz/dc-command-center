import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { isRaidLeader } from "@/lib/auth-helpers";
import { RosterTable } from "@/components/roster/roster-table";
import { AddCharacterDialog } from "@/components/roster/add-character-dialog";

export default async function RosterPage() {
  const session = await auth();
  const characters = await prisma.character.findMany({
    include: { user: { select: { id: true, name: true, battleTag: true } } },
    orderBy: [{ className: "asc" }, { name: "asc" }],
  });

  const canManage = isRaidLeader(session);

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
        {canManage && <AddCharacterDialog />}
      </div>

      <RosterTable characters={characters} />
    </div>
  );
}
