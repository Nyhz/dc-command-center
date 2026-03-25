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
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useGuild } from "@/lib/guild-context";
import { Plus } from "lucide-react";

export function AddItemDialog({ characterId }: { characterId: string }) {
  const router = useRouter();
  const { guild } = useGuild();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [itemId, setItemId] = useState("");
  const [itemName, setItemName] = useState("");
  const [itemSlot, setItemSlot] = useState("");
  const [sourceBoss, setSourceBoss] = useState("");
  const [sourceRaid, setSourceRaid] = useState("");
  const [priority, setPriority] = useState("1");
  const [note, setNote] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch(`/api/g/${guild.slug}/wishlist/${characterId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        itemId: parseInt(itemId) || 0,
        itemName,
        itemSlot: itemSlot || null,
        sourceBoss: sourceBoss || null,
        sourceRaid: sourceRaid || null,
        priority: parseInt(priority),
        note: note || null,
      }),
    });

    if (res.ok) {
      setOpen(false);
      setItemId("");
      setItemName("");
      setItemSlot("");
      setSourceBoss("");
      setSourceRaid("");
      setPriority("1");
      setNote("");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Add Item
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Add to Wishlist</DialogTitle>
          <DialogDescription>
            Add a loot item to your wishlist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-name">Item Name</Label>
              <Input id="item-name" value={itemName} onChange={(e) => setItemName(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="item-id">Item ID</Label>
              <Input id="item-id" value={itemId} onChange={(e) => setItemId(e.target.value)} placeholder="WoW item ID" required />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="source-boss">Drops From (Boss)</Label>
              <Input id="source-boss" value={sourceBoss} onChange={(e) => setSourceBoss(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="source-raid">Raid</Label>
              <Input id="source-raid" value={sourceRaid} onChange={(e) => setSourceRaid(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="item-slot">Slot</Label>
              <Input id="item-slot" value={itemSlot} onChange={(e) => setItemSlot(e.target.value)} placeholder="e.g. Head, Chest, Trinket" />
            </div>
            <div className="space-y-2">
              <Label>Priority</Label>
              <Select value={priority} onValueChange={(v) => v && setPriority(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">BiS</SelectItem>
                  <SelectItem value="2">Upgrade</SelectItem>
                  <SelectItem value="3">Minor</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="item-note">Note (optional)</Label>
            <Textarea id="item-note" value={note} onChange={(e) => setNote(e.target.value)} placeholder="Why you need this item..." />
          </div>

          <Button type="submit" disabled={loading || !itemName || !itemId} className="w-full">
            {loading ? "Adding..." : "Add to Wishlist"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
