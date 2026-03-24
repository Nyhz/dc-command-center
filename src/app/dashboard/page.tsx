import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Swords, CalendarDays, Scroll, BarChart3 } from "lucide-react";
import Link from "next/link";

const quickLinks = [
  {
    href: "/roster",
    icon: Swords,
    title: "Roster",
    description: "View and manage guild members",
  },
  {
    href: "/calendar",
    icon: CalendarDays,
    title: "Raid Calendar",
    description: "Upcoming raids and attendance",
  },
  {
    href: "/wishlist",
    icon: Scroll,
    title: "Wishlists",
    description: "Loot priorities and tracking",
  },
  {
    href: "/logs",
    icon: BarChart3,
    title: "Logs",
    description: "Performance analytics",
  },
];

export default function DashboardPage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="font-heading text-3xl font-bold tracking-wide text-primary mb-8">
        Dashboard
      </h1>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
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
