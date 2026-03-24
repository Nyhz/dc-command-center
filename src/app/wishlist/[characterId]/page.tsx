import { prisma } from "@/lib/prisma";
import { auth } from "@/auth";
import { notFound } from "next/navigation";
import { isOwner } from "@/lib/auth-helpers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ClassIcon } from "@/components/shared/class-icon";
import { CLASS_COLORS } from "@/lib/constants";
import { AddItemDialog } from "@/components/wishlist/add-item-dialog";
import { WishlistActions } from "@/components/wishlist/wishlist-actions";

const priorityLabels: Record<number, { label: string; className: string }> = {
  1: { label: "BiS", className: "bg-amber-600/20 text-amber-400 border-amber-600/30" },
  2: { label: "Upgrade", className: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  3: { label: "Minor", className: "bg-gray-600/20 text-gray-400 border-gray-600/30" },
};

export default async function CharacterWishlistPage({
  params,
}: {
  params: Promise<{ characterId: string }>;
}) {
  const { characterId } = await params;
  const session = await auth();

  const character = await prisma.character.findUnique({
    where: { id: characterId },
    include: {
      wishlistItems: { orderBy: { priority: "asc" } },
      user: { select: { id: true, name: true, battleTag: true } },
    },
  });

  if (!character) notFound();

  const canEdit = session ? isOwner(session, character.userId) : false;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <ClassIcon className={character.className} />
          <div>
            <h1
              className="font-heading text-3xl font-bold tracking-wide"
              style={{ color: CLASS_COLORS[character.className] }}
            >
              {character.name}
            </h1>
            <p className="text-sm text-muted-foreground">
              {character.specName && `${character.specName} `}{character.className} &middot; Wishlist
            </p>
          </div>
        </div>
        {canEdit && <AddItemDialog characterId={characterId} />}
      </div>

      {character.wishlistItems.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            No items on this wishlist yet.
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {character.wishlistItems.map((item) => {
            const prio = priorityLabels[item.priority] ?? priorityLabels[3];
            return (
              <Card key={item.id} className={item.obtained ? "opacity-50" : ""}>
                <CardContent className="flex items-center gap-4 py-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`font-medium ${item.obtained ? "line-through" : "text-primary"}`}>
                        {item.itemName}
                      </span>
                      <Badge variant="outline" className={`text-xs ${prio.className}`}>
                        {prio.label}
                      </Badge>
                      {item.itemSlot && (
                        <Badge variant="outline" className="text-xs">{item.itemSlot}</Badge>
                      )}
                      {item.obtained && (
                        <Badge className="bg-green-600/20 text-green-400 border-green-600/30 text-xs">
                          Obtained
                        </Badge>
                      )}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                      {item.sourceBoss && <span>{item.sourceBoss}</span>}
                      {item.sourceRaid && <span>&middot; {item.sourceRaid}</span>}
                      {item.itemLevel && <span>&middot; iLvl {item.itemLevel}</span>}
                    </div>
                    {item.note && (
                      <p className="mt-1 text-xs text-muted-foreground italic">{item.note}</p>
                    )}
                  </div>
                  {canEdit && (
                    <WishlistActions
                      characterId={characterId}
                      itemId={item.id}
                      obtained={item.obtained}
                    />
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
