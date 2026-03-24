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
import { DIFFICULTIES } from "@/lib/constants";
import { Plus } from "lucide-react";

export function CreateEventDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [title, setTitle] = useState("");
  const [raidName, setRaidName] = useState("");
  const [difficulty, setDifficulty] = useState("Heroic");
  const [description, setDescription] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/calendar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, raidName, difficulty, description, startTime, endTime }),
    });

    if (res.ok) {
      setOpen(false);
      setTitle("");
      setRaidName("");
      setDescription("");
      setStartTime("");
      setEndTime("");
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Schedule Raid
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Schedule Raid</DialogTitle>
          <DialogDescription>Create a new raid event on the calendar.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="event-title">Event Title</Label>
            <Input id="event-title" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Wednesday Prog" required />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="raid-name">Raid</Label>
              <Input id="raid-name" value={raidName} onChange={(e) => setRaidName(e.target.value)} placeholder="e.g. Liberation of Undermine" required />
            </div>
            <div className="space-y-2">
              <Label>Difficulty</Label>
              <Select value={difficulty} onValueChange={(v) => v && setDifficulty(v)}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map((d) => (
                    <SelectItem key={d} value={d}>{d}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="start-time">Start Time</Label>
              <Input id="start-time" type="datetime-local" value={startTime} onChange={(e) => setStartTime(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="end-time">End Time</Label>
              <Input id="end-time" type="datetime-local" value={endTime} onChange={(e) => setEndTime(e.target.value)} required />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="event-desc">Description (optional)</Label>
            <Textarea id="event-desc" value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Notes, strategy, etc." />
          </div>

          <Button type="submit" disabled={loading || !title || !raidName || !startTime || !endTime} className="w-full">
            {loading ? "Creating..." : "Create Event"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
