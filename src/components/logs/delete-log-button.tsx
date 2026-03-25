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

export function DeleteLogButton({ reportCode, title }: { reportCode: string; title: string }) {
  const router = useRouter();
  const { guild } = useGuild();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleDelete() {
    setLoading(true);
    await fetch(`/api/g/${guild.slug}/logs/${reportCode}`, { method: "DELETE" });
    setOpen(false);
    setLoading(false);
    router.push(`/g/${guild.slug}/logs`);
    router.refresh();
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        className="gap-2 text-destructive hover:text-destructive"
        onClick={() => setOpen(true)}
      >
        <Trash2 className="h-4 w-4" />
        Delete
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="font-heading">Delete Log</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete <strong>{title}</strong>? All associated
              performance data will be removed. This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete} disabled={loading} className="gap-2">
              <Trash2 className="h-4 w-4" />
              {loading ? "Deleting..." : "Delete Log"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
