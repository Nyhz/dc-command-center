"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import Image from "next/image";

interface EquippedItem {
  slot: { type: string; name: string };
  item: { id: number; name: string };
  name: string;
  quality: { type: string; name: string };
  level: { value: number };
  enchantments?: { enchantment_id?: number; display_string: string }[];
  sockets?: { item?: { id: number; name: string }; display_string: string }[];
  set?: { item_set: { name: string } };
  bonus_list?: number[];
  media?: { id: number };
}

function buildWowheadData(item: EquippedItem): string {
  const parts = [`item=${item.item.id}`, `ilvl=${item.level.value}`];
  if (item.enchantments?.length) {
    const enchId = item.enchantments[0]?.enchantment_id;
    if (enchId) parts.push(`ench=${enchId}`);
  }
  if (item.sockets?.length) {
    const gemIds = item.sockets
      .map((s) => s.item?.id)
      .filter(Boolean)
      .join(":");
    if (gemIds) parts.push(`gems=${gemIds}`);
  }
  if (item.bonus_list?.length) {
    parts.push(`bonus=${item.bonus_list.join(":")}`);
  }
  return parts.join("&");
}

const qualityColors: Record<string, string> = {
  POOR: "text-[#9d9d9d]",
  COMMON: "text-[#ffffff]",
  UNCOMMON: "text-[#1eff00]",
  RARE: "text-[#0070dd]",
  EPIC: "text-[#a335ee]",
  LEGENDARY: "text-[#ff8000]",
  ARTIFACT: "text-[#e6cc80]",
  HEIRLOOM: "text-[#00ccff]",
};

// Left side slots (top to bottom)
const leftSlots = ["HEAD", "NECK", "SHOULDER", "BACK", "CHEST", "SHIRT", "TABARD", "WRIST"];
// Right side slots (top to bottom)
const rightSlots = ["HANDS", "WAIST", "LEGS", "FEET", "FINGER_1", "FINGER_2", "TRINKET_1", "TRINKET_2"];
// Bottom slots
const bottomSlots = ["MAIN_HAND", "OFF_HAND"];

function GearSlot({ item, side }: { item: EquippedItem | undefined; side: "left" | "right" | "bottom" }) {
  if (!item) return null;

  const colorClass = qualityColors[item.quality.type] ?? "text-[#ffffff]";
  const isBottom = side === "bottom";

  return (
    <a
      href={`https://www.wowhead.com/item=${item.item.id}`}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2 py-1.5 px-2 rounded hover:bg-white/5 transition-colors group ${
        side === "right" ? "flex-row-reverse text-right" : ""
      } ${isBottom ? "justify-center" : ""}`}
      data-wowhead={buildWowheadData(item)}
    >
      <div className="shrink-0 w-9 h-9 rounded border border-white/10 bg-black/40 flex items-center justify-center overflow-hidden">
        <span className="text-[10px] text-muted-foreground">{item.slot.name.slice(0, 4)}</span>
      </div>
      <div className={`min-w-0 ${side === "right" ? "text-right" : ""}`}>
        <div className={`text-xs font-medium truncate max-w-[160px] ${colorClass}`}>
          {item.name}
        </div>
        <div className="text-[10px] text-muted-foreground">
          {item.level.value}
          {item.enchantments && item.enchantments.length > 0 && (
            <span className="text-green-400 ml-1">E</span>
          )}
          {item.sockets && item.sockets.length > 0 && (
            <span className="text-cyan-400 ml-1">
              {"G".repeat(item.sockets.length)}
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

export function GearDisplay({ characterId }: { characterId: string }) {
  const [items, setItems] = useState<EquippedItem[]>([]);
  const [renderUrl, setRenderUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refreshTooltips = useCallback(() => {
    // Tell Wowhead to rescan the page for new links
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).$WowheadPower) {
      const wh = (window as unknown as Record<string, { refreshLinks: () => void }>).$WowheadPower;
      wh.refreshLinks();
    }
  }, []);

  useEffect(() => {
    fetch(`/api/roster/${characterId}/equipment`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch gear");
        return r.json();
      })
      .then((data) => {
        setItems(data.equipped_items ?? []);
        setRenderUrl(data.renderUrl ?? null);
        setLoading(false);
        // Delay tooltip refresh to let DOM update
        setTimeout(refreshTooltips, 500);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [characterId, refreshTooltips]);

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-[500px]">
          <div className="flex gap-8">
            <div className="space-y-3 w-48">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
            <Skeleton className="w-48 h-96" />
            <div className="space-y-3 w-48">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-10 w-full" />
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
          Could not load gear: {error}
        </CardContent>
      </Card>
    );
  }

  const getItem = (slotType: string) => items.find((i) => i.slot.type === slotType);

  return (
    <Card className="overflow-hidden">
      <CardContent className="p-4 md:p-6">
        {/* Armory-style layout: left slots | character render | right slots */}
        <div className="flex items-start justify-center gap-2 md:gap-4">
          {/* Left column */}
          <div className="flex flex-col gap-0.5 w-48 shrink-0">
            {leftSlots.map((slot) => (
              <GearSlot key={slot} item={getItem(slot)} side="left" />
            ))}
          </div>

          {/* Character render */}
          <div className="hidden md:flex flex-col items-center shrink-0">
            {renderUrl ? (
              <div className="relative w-56 h-[420px] rounded-lg overflow-hidden border border-white/5 bg-black/20">
                <Image
                  src={renderUrl}
                  alt="Character render"
                  fill
                  className="object-cover object-top"
                  unoptimized
                />
              </div>
            ) : (
              <div className="w-56 h-[420px] rounded-lg border border-white/10 bg-black/20 flex items-center justify-center">
                <span className="text-muted-foreground text-sm">No render available</span>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="flex flex-col gap-0.5 w-48 shrink-0">
            {rightSlots.map((slot) => (
              <GearSlot key={slot} item={getItem(slot)} side="right" />
            ))}
          </div>
        </div>

        {/* Bottom: weapons */}
        <div className="flex justify-center gap-4 mt-3 pt-3 border-t border-border/50">
          {bottomSlots.map((slot) => (
            <GearSlot key={slot} item={getItem(slot)} side="bottom" />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
