"use client";

import { createContext, useContext } from "react";
import type { GuildRole } from "@prisma/client";

interface GuildContextValue {
  guild: {
    id: string;
    name: string;
    slug: string;
    realm: string;
    region: string;
  };
  membership: {
    role: GuildRole;
  };
}

const GuildContext = createContext<GuildContextValue | null>(null);

export function GuildProvider({
  guild,
  membership,
  children,
}: GuildContextValue & { children: React.ReactNode }) {
  return (
    <GuildContext.Provider value={{ guild, membership }}>
      {children}
    </GuildContext.Provider>
  );
}

export function useGuild() {
  const ctx = useContext(GuildContext);
  if (!ctx) {
    throw new Error("useGuild must be used within a GuildProvider");
  }
  return ctx;
}
