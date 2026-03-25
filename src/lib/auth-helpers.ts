import type { Session } from "next-auth";
import type { GuildRole } from "@prisma/client";

interface HasRole {
  role: GuildRole;
}

const LEADER_ROLES: GuildRole[] = ["GUILD_MASTER", "RAID_LEADER"];
const OFFICER_ROLES: GuildRole[] = [...LEADER_ROLES, "OFFICER"];

export function isRaidLeader(membership: HasRole | null | undefined): boolean {
  if (!membership) return false;
  return LEADER_ROLES.includes(membership.role);
}

export function isOfficer(membership: HasRole | null | undefined): boolean {
  if (!membership) return false;
  return OFFICER_ROLES.includes(membership.role);
}

export function isOwner(session: Session | null, userId: string): boolean {
  if (!session?.user) return false;
  return session.user.id === userId;
}
