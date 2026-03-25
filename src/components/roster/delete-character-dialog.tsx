"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { useGuild } from "@/lib/guild-context";
import { Trash2 } from "lucide-react";

export function DeleteCharacterDialog({
  characterId,
  characterName,
}: {
  characterId: string;
  characterName: string;
}) {
  const router = useRouter();
  const { guild } = useGuild();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/g/${guild.slug}/roster/${characterId}`, { method: "DELETE" });
    setOpen(false);
    setLoading(false);
    router.refresh();
  }

  return (
    <>
      <Button
        variant="ghost"
        size="icon"
        className="h-7 w-7 text-muted-foreground hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-3.5 w-3.5" />
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Remove Character</DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{characterName}</strong> from
              the roster? This will also delete their wishlist, attendance records,
              and performance data. This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
              className="gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {loading ? "Removing..." : "Remove Character"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
