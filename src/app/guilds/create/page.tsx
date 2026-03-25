"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const dynamic = "force-dynamic";

export default function CreateGuildPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [realm, setRealm] = useState("");
  const [region, setRegion] = useState("eu");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await fetch("/api/guilds", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, realm, region }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to create guild");
      setLoading(false);
      return;
    }

    router.push(`/g/${data.slug}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary mb-8">
        Create Guild
      </h1>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Guild Details</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="guild-name">Guild Name</Label>
              <Input
                id="guild-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Eternal Flames"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="guild-realm">Realm</Label>
              <Input
                id="guild-realm"
                value={realm}
                onChange={(e) => setRealm(e.target.value)}
                placeholder="e.g. Sanguino"
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
                  <SelectItem value="eu">EU</SelectItem>
                  <SelectItem value="us">US</SelectItem>
                  <SelectItem value="kr">KR</SelectItem>
                  <SelectItem value="tw">TW</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button
              type="submit"
              disabled={loading || !name || !realm}
              className="w-full"
            >
              {loading ? "Creating..." : "Create Guild"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
