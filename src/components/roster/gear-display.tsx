"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface EquippedItem {
  slot: { type: string; name: string };
  item: { id: number; name: string };
  name: string;
  quality: { type: string; name: string };
  level: { value: number };
  enchantments?: { display_string: string }[];
  sockets?: { item?: { id: number; name: string }; display_string: string }[];
  set?: { item_set: { name: string } };
}

const qualityColors: Record<string, string> = {
  POOR: "text-gray-500",
  COMMON: "text-gray-300",
  UNCOMMON: "text-green-400",
  RARE: "text-blue-400",
  EPIC: "text-purple-400",
  LEGENDARY: "text-orange-400",
  ARTIFACT: "text-amber-300",
  HEIRLOOM: "text-cyan-400",
};

const slotOrder = [
  "HEAD", "NECK", "SHOULDER", "BACK",
  "CHEST", "WRIST", "HANDS", "WAIST",
  "LEGS", "FEET", "FINGER_1", "FINGER_2",
  "TRINKET_1", "TRINKET_2", "MAIN_HAND", "OFF_HAND",
];

export function GearDisplay({ characterId }: { characterId: string }) {
  const [items, setItems] = useState<EquippedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/roster/${characterId}/equipment`)
      .then((r) => {
        if (!r.ok) throw new Error("Failed to fetch gear");
        return r.json();
      })
      .then((data) => {
        setItems(data.equipped_items ?? []);
        setLoading(false);
      })
      .catch((e) => {
        setError(e.message);
        setLoading(false);
      });
  }, [characterId]);

  if (loading) {
    return (
      <div className="space-y-2">
        {Array.from({ length: 16 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
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

  if (items.length === 0) {
    return (
      <Card>
        <CardContent className="flex h-24 items-center justify-center text-muted-foreground">
          No gear data available.
        </CardContent>
      </Card>
    );
  }

  // Sort by slot order
  const sorted = [...items].sort((a, b) => {
    const ai = slotOrder.indexOf(a.slot.type);
    const bi = slotOrder.indexOf(b.slot.type);
    return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
  });

  return (
    <div className="space-y-1.5">
      {sorted.map((item) => {
        const colorClass = qualityColors[item.quality.type] ?? "text-gray-300";

        return (
          <Card key={item.slot.type} className="py-0">
            <CardContent className="flex items-center gap-3 py-2.5 px-4">
              <span className="w-24 shrink-0 text-xs text-muted-foreground truncate">
                {item.slot.name}
              </span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.wowhead.com/item=${item.item.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`font-medium text-sm truncate hover:underline ${colorClass}`}
                  >
                    {item.name}
                  </a>
                  <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0 font-mono">
                    {item.level.value}
                  </Badge>
                  {item.set && (
                    <Badge variant="outline" className="shrink-0 text-[10px] px-1 py-0 text-green-400 border-green-600/30">
                      Set
                    </Badge>
                  )}
                </div>
                {(item.enchantments || item.sockets) && (
                  <div className="flex flex-wrap gap-x-3 mt-0.5">
                    {item.enchantments?.map((e, i) => (
                      <span key={i} className="text-[11px] text-green-400">{e.display_string}</span>
                    ))}
                    {item.sockets?.map((s, i) => (
                      <span key={i} className="text-[11px] text-cyan-400">
                        {s.item?.name ?? s.display_string}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
