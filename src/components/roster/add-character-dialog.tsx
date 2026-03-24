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
import { WOW_CLASSES, CLASS_SPECS, RAID_ROLES } from "@/lib/constants";
import { Plus } from "lucide-react";

export function AddCharacterDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState("");
  const [realm, setRealm] = useState("");
  const [className, setClassName] = useState("");
  const [specName, setSpecName] = useState("");
  const [raidRole, setRaidRole] = useState("DPS");
  const [isMain, setIsMain] = useState(false);

  const specs = className ? CLASS_SPECS[className] ?? [] : [];

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    const res = await fetch("/api/roster", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        realm: realm.toLowerCase().replace(/ /g, "-"),
        className,
        specName: specName || null,
        raidRole,
        isMain,
      }),
    });

    if (res.ok) {
      setOpen(false);
      setName("");
      setRealm("");
      setClassName("");
      setSpecName("");
      setRaidRole("DPS");
      setIsMain(false);
      router.refresh();
    }

    setLoading(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button size="sm" className="gap-2" />}>
        <Plus className="h-4 w-4" />
        Add Character
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Add Character</DialogTitle>
          <DialogDescription>
            Add a character to the guild roster.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="char-name">Character Name</Label>
              <Input
                id="char-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="char-realm">Realm</Label>
              <Input
                id="char-realm"
                value={realm}
                onChange={(e) => setRealm(e.target.value)}
                placeholder="e.g. Area 52"
                required
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Class</Label>
              <Select value={className} onValueChange={(v) => { if (v) { setClassName(v); setSpecName(""); } }}>
                <SelectTrigger>
                  <SelectValue placeholder="Select class" />
                </SelectTrigger>
                <SelectContent>
                  {WOW_CLASSES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Spec</Label>
              <Select value={specName} onValueChange={(v) => v && setSpecName(v)} disabled={!className}>
                <SelectTrigger>
                  <SelectValue placeholder="Select spec" />
                </SelectTrigger>
                <SelectContent>
                  {specs.map((s) => (
                    <SelectItem key={s.name} value={s.name}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Raid Role</Label>
              <Select value={raidRole} onValueChange={(v) => v && setRaidRole(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {RAID_ROLES.map((r) => (
                    <SelectItem key={r} value={r}>{r}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-end gap-2 pb-1">
              <input
                type="checkbox"
                id="is-main"
                checked={isMain}
                onChange={(e) => setIsMain(e.target.checked)}
                className="h-4 w-4"
              />
              <Label htmlFor="is-main">Main character</Label>
            </div>
          </div>

          <Button type="submit" disabled={loading || !name || !realm || !className} className="w-full">
            {loading ? "Adding..." : "Add Character"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
