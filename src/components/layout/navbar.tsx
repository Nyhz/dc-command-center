"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useParams } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  Shield,
  Scroll,
  CalendarDays,
  BarChart3,
  Swords,
  Menu,
  X,
  Settings,
} from "lucide-react";
import { UserAvatar } from "@/components/auth/user-avatar";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";

const guildNavItems = [
  { path: "/dashboard", label: "Dashboard", icon: Shield },
  { path: "/roster", label: "Roster", icon: Swords },
  { path: "/wishlist", label: "Wishlists", icon: Scroll },
  { path: "/calendar", label: "Calendar", icon: CalendarDays },
  { path: "/logs", label: "Logs", icon: BarChart3 },
  { path: "/settings", label: "Settings", icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const params = useParams();
  const { data: session } = useSession();
  const [mobileOpen, setMobileOpen] = useState(false);

  const guildSlug = params?.guildSlug as string | undefined;
  const isInGuild = !!guildSlug;

  const navItems = isInGuild
    ? guildNavItems.map((item) => ({
        ...item,
        href: `/g/${guildSlug}${item.path}`,
      }))
    : [];

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center px-4">
        <Link
          href={isInGuild ? `/g/${guildSlug}/dashboard` : session ? "/guilds" : "/"}
          className="mr-8 flex items-center gap-2"
        >
          <Swords className="h-6 w-6 text-primary" />
          <span className="font-heading text-lg font-bold tracking-wide text-primary">
            Command Center
          </span>
        </Link>

        {/* Desktop nav — only show when inside a guild */}
        {isInGuild && (
          <nav className="hidden md:flex items-center gap-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname.startsWith(item.href);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-accent text-primary"
                      : "text-muted-foreground hover:bg-accent hover:text-foreground"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>
        )}

        <div className="ml-auto flex items-center gap-2">
          {session && isInGuild && (
            <Link href="/guilds">
              <Button size="sm" variant="ghost" className="text-xs text-muted-foreground">
                Switch Guild
              </Button>
            </Link>
          )}
          {session ? (
            <UserAvatar />
          ) : (
            <Link href="/login">
              <Button size="sm" variant="outline" className="font-heading tracking-wide">
                Sign In
              </Button>
            </Link>
          )}
          {isInGuild && (
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden"
              onClick={() => setMobileOpen(!mobileOpen)}
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </Button>
          )}
        </div>
      </div>

      {/* Mobile nav */}
      {mobileOpen && isInGuild && (
        <nav className="border-t border-border bg-background px-4 py-2 md:hidden">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-primary"
                    : "text-muted-foreground hover:bg-accent hover:text-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>
      )}
    </header>
  );
}
