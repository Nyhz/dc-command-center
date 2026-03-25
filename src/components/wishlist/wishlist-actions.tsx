"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGuild } from "@/lib/guild-context";
import { Check, Trash2 } from "lucide-react";

export function WishlistActions({
  characterId,
  itemId,
  obtained,
}: {
  characterId: string;
  itemId: string;
  obtained: boolean;
}) {
  const router = useRouter();
  const { guild } = useGuild();

  async function toggleObtained() {
    await fetch(`/api/g/${guild.slug}/wishlist/${characterId}/${itemId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ obtained: !obtained }),
    });
    router.refresh();
  }

  async function remove() {
    await fetch(`/api/g/${guild.slug}/wishlist/${characterId}/${itemId}`, { method: "DELETE" });
    router.refresh();
  }

  return (
    <div className="flex gap-1">
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={toggleObtained}
        title={obtained ? "Mark as not obtained" : "Mark as obtained"}
      >
        <Check className={`h-4 w-4 ${obtained ? "text-green-400" : "text-muted-foreground"}`} />
      </Button>
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 text-destructive hover:text-destructive"
        onClick={remove}
        title="Remove from wishlist"
      >
        <Trash2 className="h-4 w-4" />
      </Button>
    </div>
  );
}
