import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClassIcon } from "@/components/shared/class-icon";
import { CLASS_COLORS } from "@/lib/constants";
import Link from "next/link";

const priorityLabels: Record<number, { label: string; className: string }> = {
  1: { label: "BiS", className: "bg-amber-600/20 text-amber-400 border-amber-600/30" },
  2: { label: "Upgrade", className: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  3: { label: "Minor", className: "bg-gray-600/20 text-gray-400 border-gray-600/30" },
};

export default async function WishlistOverviewPage() {
  const items = await prisma.wishlistItem.findMany({
    where: { obtained: false },
    include: {
      character: {
        select: { id: true, name: true, className: true, raidRole: true },
      },
    },
    orderBy: [{ sourceRaid: "asc" }, { sourceBoss: "asc" }, { priority: "asc" }],
  });

  // Group by boss
  const byBoss = new Map<string, typeof items>();
  for (const item of items) {
    const key = item.sourceBoss ?? "Unknown Source";
    if (!byBoss.has(key)) byBoss.set(key, []);
    byBoss.get(key)!.push(item);
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
          Wishlists
        </h1>
        <p className="mt-1 text-muted-foreground">
          Loot council view — all active wishlists grouped by boss
        </p>
      </div>

      {byBoss.size === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            No wishlist items yet. Members can add items from their character pages.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Array.from(byBoss.entries()).map(([boss, bossItems]) => {
            // Group items by item name within boss
            const byItem = new Map<string, typeof bossItems>();
            for (const item of bossItems) {
              if (!byItem.has(item.itemName)) byItem.set(item.itemName, []);
              byItem.get(item.itemName)!.push(item);
            }

            return (
              <Card key={boss}>
                <CardHeader>
                  <CardTitle className="font-heading text-lg">{boss}</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {Array.from(byItem.entries()).map(([itemName, itemEntries]) => (
                    <div key={itemName} className="rounded-md border border-border/50 p-3">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="font-medium text-primary">{itemName}</span>
                        {itemEntries[0]?.itemLevel && (
                          <span className="text-xs text-muted-foreground">
                            iLvl {itemEntries[0].itemLevel}
                          </span>
                        )}
                        {itemEntries[0]?.itemSlot && (
                          <Badge variant="outline" className="text-xs">
                            {itemEntries[0].itemSlot}
                          </Badge>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-3">
                        {itemEntries.map((entry) => {
                          const prio = priorityLabels[entry.priority] ?? priorityLabels[3];
                          return (
                            <Link
                              key={entry.id}
                              href={`/wishlist/${entry.character.id}`}
                              className="flex items-center gap-2 rounded-md bg-accent/50 px-2 py-1 text-sm hover:bg-accent"
                            >
                              <ClassIcon className={entry.character.className} />
                              <span style={{ color: CLASS_COLORS[entry.character.className] }}>
                                {entry.character.name}
                              </span>
                              <Badge variant="outline" className={`text-[10px] px-1 py-0 ${prio?.className}`}>
                                {prio?.label}
                              </Badge>
                            </Link>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
