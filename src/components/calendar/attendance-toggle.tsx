"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { ClassIcon } from "@/components/shared/class-icon";
import { useGuild } from "@/lib/guild-context";
import { Check, X, HelpCircle } from "lucide-react";

interface AttendanceToggleProps {
  eventId: string;
  characters: { id: string; name: string; className: string; raidRole: string }[];
  existingAttendances: { characterId: string; status: string; note: string | null }[];
}

export function AttendanceToggle({ eventId, characters, existingAttendances }: AttendanceToggleProps) {
  const router = useRouter();
  const { guild } = useGuild();
  const [loading, setLoading] = useState<string | null>(null);

  async function setAttendance(characterId: string, status: string) {
    setLoading(characterId);
    await fetch(`/api/g/${guild.slug}/calendar/${eventId}/attendance`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ characterId, status }),
    });
    setLoading(null);
    router.refresh();
  }

  return (
    <div className="space-y-3">
      {characters.map((char) => {
        const current = existingAttendances.find((a) => a.characterId === char.id);
        const isLoading = loading === char.id;

        return (
          <div key={char.id} className="flex items-center gap-3">
            <ClassIcon className={char.className} />
            <span className="text-sm font-medium min-w-[100px]">{char.name}</span>
            <div className="flex gap-1">
              <Button
                size="sm"
                variant={current?.status === "ATTENDING" ? "default" : "outline"}
                className="h-7 gap-1 px-2 text-xs"
                disabled={isLoading}
                onClick={() => setAttendance(char.id, "ATTENDING")}
              >
                <Check className="h-3 w-3" /> Attending
              </Button>
              <Button
                size="sm"
                variant={current?.status === "TENTATIVE" ? "default" : "outline"}
                className="h-7 gap-1 px-2 text-xs"
                disabled={isLoading}
                onClick={() => setAttendance(char.id, "TENTATIVE")}
              >
                <HelpCircle className="h-3 w-3" /> Tentative
              </Button>
              <Button
                size="sm"
                variant={current?.status === "ABSENT" ? "destructive" : "outline"}
                className="h-7 gap-1 px-2 text-xs"
                disabled={isLoading}
                onClick={() => setAttendance(char.id, "ABSENT")}
              >
                <X className="h-3 w-3" /> Absent
              </Button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
