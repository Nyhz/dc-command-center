"use client";

import { useState, useEffect } from "react";
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
import { Shield, Loader2 } from "lucide-react";
import { use } from "react";

export const dynamic = "force-dynamic";

interface BlizzardCharacter {
  name: string;
  realm: string;
  realmSlug: string;
  level: number;
  className: string;
  faction: string;
  id: number;
}

interface InviteInfo {
  guild: {
    name: string;
    realm: string;
    region: string;
    slug: string;
  };
  valid: boolean;
  error?: string;
}

export default function InviteRedemptionPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = use(params);
  const router = useRouter();
  const [inviteInfo, setInviteInfo] = useState<InviteInfo | null>(null);
  const [characters, setCharacters] = useState<BlizzardCharacter[]>([]);
  const [loadingInvite, setLoadingInvite] = useState(true);
  const [loadingChars, setLoadingChars] = useState(true);
  const [selectedChar, setSelectedChar] = useState<string>("");
  const [manualName, setManualName] = useState("");
  const [manualRealm, setManualRealm] = useState("");
  const [manualClass, setManualClass] = useState("");
  const [useManual, setUseManual] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // Fetch invite info
    fetch(`/api/invite/${code}`, { method: "GET" })
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setInviteInfo(data);
        } else {
          const data = await r.json().catch(() => ({}));
          setInviteInfo({ guild: { name: "", realm: "", region: "", slug: "" }, valid: false, error: data.error ?? "Invalid invite" });
        }
      })
      .catch(() => {
        setInviteInfo({ guild: { name: "", realm: "", region: "", slug: "" }, valid: false, error: "Failed to load invite" });
      })
      .finally(() => setLoadingInvite(false));

    // Fetch user's WoW characters
    fetch("/api/blizzard/characters")
      .then(async (r) => {
        if (r.ok) {
          const data = await r.json();
          setCharacters(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        // Characters not available, use manual entry
      })
      .finally(() => setLoadingChars(false));
  }, [code]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");

    let body: Record<string, unknown>;

    if (useManual || characters.length === 0) {
      if (!manualName || !manualRealm || !manualClass) {
        setError("Please fill in all character fields.");
        setSubmitting(false);
        return;
      }
      body = {
        characterName: manualName,
        realm: manualRealm.toLowerCase().replace(/ /g, "-"),
        region: inviteInfo?.guild.region ?? "us",
        className: manualClass,
      };
    } else {
      const char = characters.find((c) => `${c.name}-${c.realmSlug}` === selectedChar);
      if (!char) {
        setError("Please select a character.");
        setSubmitting(false);
        return;
      }
      body = {
        characterName: char.name,
        realm: char.realmSlug,
        region: inviteInfo?.guild.region ?? "us",
        className: char.className,
      };
    }

    const res = await fetch(`/api/invite/${code}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Failed to join guild");
      setSubmitting(false);
      return;
    }

    router.push(`/g/${data.guild.slug}/dashboard`);
  }

  if (loadingInvite) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!inviteInfo?.valid) {
    return (
      <div className="mx-auto max-w-lg px-4 py-8">
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            {inviteInfo?.error ?? "This invite link is invalid or has expired."}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-4 py-8">
      <div className="mb-8 text-center">
        <Shield className="mx-auto h-12 w-12 text-primary mb-4" />
        <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
          Join Guild
        </h1>
        <p className="mt-2 text-muted-foreground">
          You have been invited to join{" "}
          <span className="font-medium text-foreground">{inviteInfo.guild.name}</span>
        </p>
        <p className="text-sm text-muted-foreground">
          {inviteInfo.guild.realm} &middot; {inviteInfo.guild.region.toUpperCase()}
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Select Your Character</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {loadingChars ? (
              <div className="flex items-center justify-center py-4">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
                <span className="ml-2 text-sm text-muted-foreground">Loading characters...</span>
              </div>
            ) : characters.length > 0 && !useManual ? (
              <>
                <div className="space-y-2">
                  <Label>Your WoW Characters</Label>
                  <Select value={selectedChar} onValueChange={(v) => v && setSelectedChar(v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a character" />
                    </SelectTrigger>
                    <SelectContent>
                      {characters
                        .filter((c) => c.level >= 70)
                        .map((c) => (
                          <SelectItem key={`${c.name}-${c.realmSlug}`} value={`${c.name}-${c.realmSlug}`}>
                            {c.name} - {c.realm} ({c.className}, Lv{c.level})
                          </SelectItem>
                        ))}
                    </SelectContent>
                  </Select>
                </div>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-primary underline"
                  onClick={() => setUseManual(true)}
                >
                  Enter character manually instead
                </button>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="char-name">Character Name</Label>
                  <Input
                    id="char-name"
                    value={manualName}
                    onChange={(e) => setManualName(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-realm">Realm</Label>
                  <Input
                    id="char-realm"
                    value={manualRealm}
                    onChange={(e) => setManualRealm(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="char-class">Class</Label>
                  <Input
                    id="char-class"
                    value={manualClass}
                    onChange={(e) => setManualClass(e.target.value)}
                    placeholder="e.g. Paladin"
                    required
                  />
                </div>
                {characters.length > 0 && (
                  <button
                    type="button"
                    className="text-xs text-muted-foreground hover:text-primary underline"
                    onClick={() => setUseManual(false)}
                  >
                    Select from your WoW characters instead
                  </button>
                )}
              </>
            )}

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" disabled={submitting} className="w-full">
              {submitting ? "Joining..." : "Join Guild"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
