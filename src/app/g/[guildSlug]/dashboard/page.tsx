import { auth } from "@/auth";
import { resolveGuild } from "@/lib/guild-helpers";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, CalendarDays, Scroll, BarChart3, Settings } from "lucide-react";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function GuildDashboardPage({
  params,
}: {
  params: Promise<{ guildSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { guildSlug } = await params;
  const ctx = await resolveGuild(guildSlug, session.user.id);
  if (!ctx) redirect("/guilds");

  const { guild } = ctx;
  const base = `/g/${guild.slug}`;

  const quickLinks = [
    {
      href: `${base}/roster`,
      icon: Swords,
      title: "Roster",
      description: "View and manage guild members",
    },
    {
      href: `${base}/calendar`,
      icon: CalendarDays,
      title: "Raid Calendar",
      description: "Upcoming raids and attendance",
    },
    {
      href: `${base}/wishlist`,
      icon: Scroll,
      title: "Wishlists",
      description: "Loot priorities and tracking",
    },
    {
      href: `${base}/logs`,
      icon: BarChart3,
      title: "Logs",
      description: "Performance analytics",
    },
    {
      href: `${base}/settings`,
      icon: Settings,
      title: "Settings",
      description: "Guild configuration and invites",
    },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary mb-2">
        {guild.name}
      </h1>
      <p className="mb-8 text-muted-foreground">
        {guild.realm} &middot; {guild.region.toUpperCase()}
      </p>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {quickLinks.map((item) => {
          const Icon = item.icon;
          return (
            <Link key={item.href} href={item.href}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Icon className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base font-heading tracking-wide">
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{item.description}</p>
                </CardContent>
              </Card>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
