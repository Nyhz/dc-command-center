"use client";

import { useState, useEffect, useCallback } from "react";
import { useGuild } from "@/lib/guild-context";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Copy, Plus, Trash2, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

interface Invite {
  id: string;
  code: string;
  expiresAt: string | null;
  maxUses: number | null;
  uses: number;
  createdAt: string;
}

interface Member {
  id: string;
  userId: string;
  role: string;
  joinedAt: string;
  user: {
    id: string;
    name: string | null;
    battleTag: string | null;
  };
}

const roleLabels: Record<string, string> = {
  GUILD_MASTER: "Guild Master",
  RAID_LEADER: "Raid Leader",
  OFFICER: "Officer",
  MEMBER: "Member",
};

const roleOrder = ["GUILD_MASTER", "RAID_LEADER", "OFFICER", "MEMBER"];

export default function GuildSettingsPage() {
  const { guild, membership } = useGuild();
  const [invites, setInvites] = useState<Invite[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [creatingInvite, setCreatingInvite] = useState(false);
  const [expiresInHours, setExpiresInHours] = useState("24");
  const [maxUses, setMaxUses] = useState("");
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  const isGM = membership.role === "GUILD_MASTER";
  const isRL = membership.role === "GUILD_MASTER" || membership.role === "RAID_LEADER";

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [invitesRes, membersRes] = await Promise.all([
        fetch(`/api/g/${guild.slug}/invites`),
        fetch(`/api/g/${guild.slug}/members`),
      ]);
      if (invitesRes.ok) setInvites(await invitesRes.json());
      if (membersRes.ok) setMembers(await membersRes.json());
    } catch {
      // silently fail
    }
    setLoading(false);
  }, [guild.slug]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  async function createInvite() {
    setCreatingInvite(true);
    const res = await fetch(`/api/g/${guild.slug}/invites`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        expiresInHours: parseInt(expiresInHours) || 24,
        maxUses: maxUses ? parseInt(maxUses) : null,
      }),
    });
    if (res.ok) {
      const invite = await res.json();
      setInvites((prev) => [invite, ...prev]);
    }
    setCreatingInvite(false);
  }

  function copyInviteLink(code: string) {
    const url = `${window.location.origin}/invite/${code}`;
    navigator.clipboard.writeText(url);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  async function changeRole(memberId: string, newRole: string) {
    const res = await fetch(`/api/g/${guild.slug}/members`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ memberId, role: newRole }),
    });
    if (res.ok) {
      setMembers((prev) =>
        prev.map((m) => (m.id === memberId ? { ...m, role: newRole } : m))
      );
    }
  }

  if (!isRL) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8">
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            Only Guild Masters and Raid Leaders can access guild settings.
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary mb-8">
        Guild Settings
      </h1>

      {/* Guild Info */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-heading">Guild Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="flex items-center gap-2">
            <Shield className="h-4 w-4 text-primary" />
            <span className="font-medium">{guild.name}</span>
          </div>
          <p className="text-sm text-muted-foreground">
            {guild.realm} &middot; {guild.region.toUpperCase()}
          </p>
        </CardContent>
      </Card>

      {/* Invites */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="font-heading">Invite Links</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-end gap-3">
            <div className="space-y-1">
              <Label className="text-xs">Expires in (hours)</Label>
              <Input
                value={expiresInHours}
                onChange={(e) => setExpiresInHours(e.target.value)}
                className="w-24"
                type="number"
                min="1"
              />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Max uses (blank = unlimited)</Label>
              <Input
                value={maxUses}
                onChange={(e) => setMaxUses(e.target.value)}
                className="w-32"
                type="number"
                min="1"
                placeholder="Unlimited"
              />
            </div>
            <Button
              size="sm"
              className="gap-2"
              onClick={createInvite}
              disabled={creatingInvite}
            >
              <Plus className="h-4 w-4" />
              {creatingInvite ? "Creating..." : "Create Invite"}
            </Button>
          </div>

          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invite links created yet.</p>
          ) : (
            <div className="space-y-2">
              {invites.map((invite) => {
                const expired = invite.expiresAt && new Date(invite.expiresAt) < new Date();
                const maxedOut = invite.maxUses !== null && invite.uses >= invite.maxUses;
                const isActive = !expired && !maxedOut;

                return (
                  <div
                    key={invite.id}
                    className="flex items-center justify-between rounded-md border border-border/50 p-3"
                  >
                    <div>
                      <code className="text-sm font-mono text-primary">{invite.code}</code>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>{invite.uses}{invite.maxUses !== null ? `/${invite.maxUses}` : ""} uses</span>
                        {invite.expiresAt && (
                          <span>
                            &middot; {expired ? "Expired" : `Expires ${new Date(invite.expiresAt).toLocaleDateString()}`}
                          </span>
                        )}
                        <Badge
                          variant="outline"
                          className={`text-[10px] ${isActive ? "text-green-400 border-green-400/30" : "text-red-400 border-red-400/30"}`}
                        >
                          {isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1"
                      onClick={() => copyInviteLink(invite.code)}
                    >
                      <Copy className="h-3 w-3" />
                      {copiedCode === invite.code ? "Copied!" : "Copy Link"}
                    </Button>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Members */}
      <Card>
        <CardHeader>
          <CardTitle className="font-heading">Members</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-sm text-muted-foreground">Loading...</p>
          ) : members.length === 0 ? (
            <p className="text-sm text-muted-foreground">No members found.</p>
          ) : (
            <div className="space-y-2">
              {members
                .sort((a, b) => roleOrder.indexOf(a.role) - roleOrder.indexOf(b.role))
                .map((member) => (
                  <div
                    key={member.id}
                    className="flex items-center justify-between rounded-md border border-border/50 p-3"
                  >
                    <div>
                      <span className="font-medium">
                        {member.user.battleTag ?? member.user.name ?? "Unknown"}
                      </span>
                      <div className="mt-1">
                        <Badge variant="outline" className="text-xs">
                          {roleLabels[member.role] ?? member.role}
                        </Badge>
                      </div>
                    </div>
                    {isGM && member.role !== "GUILD_MASTER" && (
                      <Select
                        value={member.role}
                        onValueChange={(v) => v && changeRole(member.id, v)}
                      >
                        <SelectTrigger className="w-[150px]">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="RAID_LEADER">Raid Leader</SelectItem>
                          <SelectItem value="OFFICER">Officer</SelectItem>
                          <SelectItem value="MEMBER">Member</SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
