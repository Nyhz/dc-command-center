import Link from "next/link";
import { Shield, Scroll, CalendarDays, BarChart3, Swords } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const features = [
  {
    icon: Swords,
    title: "Guild Roster",
    description: "Full roster with class, spec, role, and item level. Synced from Battle.net.",
  },
  {
    icon: Scroll,
    title: "Wishlists",
    description: "Track loot priorities per character. Loot council view for fair distribution.",
  },
  {
    icon: CalendarDays,
    title: "Raid Calendar",
    description: "Schedule raids and track attendance. Know your comp before raid night.",
  },
  {
    icon: BarChart3,
    title: "Performance",
    description: "Warcraft Logs integration. Per-boss breakdowns, rankings, and trends.",
  },
];

export default function HomePage() {
  return (
    <div className="flex flex-col items-center justify-center px-4">
      <section className="flex flex-col items-center gap-8 py-24 text-center">
        <div className="flex items-center gap-3">
          <Shield className="h-12 w-12 text-primary" />
          <h1 className="font-heading text-5xl font-bold tracking-wide text-primary">
            Command Center
          </h1>
        </div>

        <p className="max-w-xl text-lg text-muted-foreground">
          Your guild&apos;s headquarters. Manage your roster, plan raids, track
          loot, and analyze performance — all in one place.
        </p>

        <div className="flex gap-4">
          <Link href="/guilds">
            <Button size="lg" className="font-heading tracking-wide">
              Enter Command Center
            </Button>
          </Link>
        </div>
      </section>

      <section className="grid w-full max-w-5xl gap-6 pb-24 sm:grid-cols-2">
        {features.map((feature) => {
          const Icon = feature.icon;
          return (
            <Card key={feature.title} className="border-border bg-card">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="rounded-md bg-primary/10 p-2">
                    <Icon className="h-5 w-5 text-primary" />
                  </div>
                  <CardTitle className="font-heading tracking-wide">
                    {feature.title}
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          );
        })}
      </section>
    </div>
  );
}
