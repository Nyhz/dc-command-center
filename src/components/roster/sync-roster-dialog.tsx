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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

export function SyncRosterDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [guildName, setGuildName] = useState("");
  const [realmSlug, setRealmSlug] = useState("");
  const [region, setRegion] = useState("eu");
  const [result, setResult] = useState<{ synced: number; total: number } | null>(null);
  const [error, setError] = useState("");

  async function handleSync(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    setResult(null);

    try {
      const res = await fetch("/api/roster/sync", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ guildName, realmSlug: realmSlug.toLowerCase().replace(/ /g, "-"), region }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? `Failed to sync: ${res.status}`);
      } else {
        const data = await res.json();
        setResult(data);
        router.refresh();
      }
    } catch {
      setError("Network error. Check your connection.");
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" variant="outline" className="gap-2" />}>
        <RefreshCw className="h-4 w-4" />
        Sync from Blizzard
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Sync Guild Roster</DialogTitle>
          <DialogDescription>
            Fetch your guild roster from the Blizzard API. This will import all guild members with their class, spec, and item level.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSync} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="guild-name">Guild Name</Label>
            <Input
              id="guild-name"
              value={guildName}
              onChange={(e) => setGuildName(e.target.value)}
              placeholder="e.g. My Guild Name"
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="realm-slug">Realm</Label>
              <Input
                id="realm-slug"
                value={realmSlug}
                onChange={(e) => setRealmSlug(e.target.value)}
                placeholder="e.g. Ragnaros"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Region</Label>
              <Select value={region} onValueChange={(v) => v && setRegion(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="us">US</SelectItem>
                  <SelectItem value="eu">EU</SelectItem>
                  <SelectItem value="kr">KR</SelectItem>
                  <SelectItem value="tw">TW</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          {result && (
            <p className="text-sm text-green-400">
              Synced {result.synced} of {result.total} guild members.
            </p>
          )}

          <Button type="submit" disabled={loading || !guildName || !realmSlug} className="w-full">
            {loading ? (
              <>
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                Syncing... (this may take a minute)
              </>
            ) : (
              "Sync Roster"
            )}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
