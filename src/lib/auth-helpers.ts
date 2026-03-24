import type { Session } from "next-auth";
import type { GuildRole } from "@prisma/client";

const LEADER_ROLES: GuildRole[] = ["GUILD_MASTER", "RAID_LEADER"];
const OFFICER_ROLES: GuildRole[] = [...LEADER_ROLES, "OFFICER"];

export function isRaidLeader(session: Session | null): boolean {
  if (!session?.user) return false;
  return LEADER_ROLES.includes(session.user.guildRole);
}

export function isOfficer(session: Session | null): boolean {
  if (!session?.user) return false;
  return OFFICER_ROLES.includes(session.user.guildRole);
}

export function isOwner(session: Session | null, userId: string): boolean {
  if (!session?.user) return false;
  return session.user.id === userId;
}
