"use client";

import { useState, useEffect } from "react";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isSameMonth, addMonths, subMonths } from "date-fns";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useGuild } from "@/lib/guild-context";
import Link from "next/link";

interface RaidEventData {
  id: string;
  title: string;
  raidName: string;
  difficulty: string;
  startTime: string;
  endTime: string;
  attendances: {
    status: string;
    character: { name: string; raidRole: string };
  }[];
}

export function RaidCalendar() {
  const { guild } = useGuild();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [events, setEvents] = useState<RaidEventData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const month = format(currentDate, "yyyy-MM");
    setLoading(true);
    fetch(`/api/g/${guild.slug}/calendar?month=${month}`)
      .then((r) => r.json())
      .then((data) => {
        setEvents(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentDate, guild.slug]);

  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Pad start to align to week grid (Sunday start)
  const startPad = monthStart.getDay();
  const padDays = Array.from({ length: startPad }, (_, i) => {
    const d = new Date(monthStart);
    d.setDate(d.getDate() - (startPad - i));
    return d;
  });

  const allDays = [...padDays, ...days];
  // Pad end to fill grid
  const endPad = 7 - (allDays.length % 7);
  if (endPad < 7) {
    for (let i = 1; i <= endPad; i++) {
      const d = new Date(monthEnd);
      d.setDate(d.getDate() + i);
      allDays.push(d);
    }
  }

  function getEventsForDay(day: Date) {
    return events.filter((e) => isSameDay(new Date(e.startTime), day));
  }

  const difficultyColors: Record<string, string> = {
    Mythic: "bg-purple-600/20 text-purple-400 border-purple-600/30",
    Heroic: "bg-amber-600/20 text-amber-400 border-amber-600/30",
    Normal: "bg-green-600/20 text-green-400 border-green-600/30",
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(subMonths(currentDate, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <CardTitle className="font-heading text-xl tracking-wide">
            {format(currentDate, "MMMM yyyy")}
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setCurrentDate(addMonths(currentDate, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex h-64 items-center justify-center text-muted-foreground">
            Loading...
          </div>
        ) : (
          <div className="grid grid-cols-7 gap-px">
            {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
              <div key={d} className="p-2 text-center text-xs font-medium text-muted-foreground">
                {d}
              </div>
            ))}
            {allDays.map((day, i) => {
              const dayEvents = getEventsForDay(day);
              const isCurrentMonth = isSameMonth(day, currentDate);
              const isToday = isSameDay(day, new Date());

              return (
                <div
                  key={i}
                  className={`min-h-[80px] rounded-md border border-border/50 p-1 ${
                    !isCurrentMonth ? "opacity-30" : ""
                  } ${isToday ? "border-primary/50 bg-primary/5" : ""}`}
                >
                  <div className="text-right text-xs text-muted-foreground">
                    {format(day, "d")}
                  </div>
                  {dayEvents.map((event) => {
                    const attending = event.attendances.filter((a) => a.status === "ATTENDING").length;
                    return (
                      <Link key={event.id} href={`/g/${guild.slug}/calendar/${event.id}`}>
                        <div className="mt-0.5 cursor-pointer rounded bg-accent/50 px-1 py-0.5 text-xs hover:bg-accent">
                          <div className="truncate font-medium">{event.title}</div>
                          <div className="flex items-center gap-1">
                            <Badge
                              variant="outline"
                              className={`text-[10px] px-1 py-0 ${difficultyColors[event.difficulty] ?? ""}`}
                            >
                              {event.difficulty}
                            </Badge>
                            <span className="text-muted-foreground">{attending} signed</span>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
