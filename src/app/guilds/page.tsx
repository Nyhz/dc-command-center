import { auth } from "@/auth";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Shield } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function GuildsPage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const memberships = await prisma.guildMember.findMany({
    where: { userId: session.user.id },
    include: {
      guild: { select: { id: true, name: true, slug: true, realm: true, region: true } },
    },
    orderBy: { joinedAt: "asc" },
  });

  // Auto-redirect if user has exactly one guild
  if (memberships.length === 1) {
    redirect(`/g/${memberships[0].guild.slug}/dashboard`);
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold tracking-wide text-primary">
            Your Guilds
          </h1>
          <p className="mt-1 text-muted-foreground">
            Select a guild to manage, or create a new one.
          </p>
        </div>
        <Link href="/guilds/create">
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Create Guild
          </Button>
        </Link>
      </div>

      {memberships.length === 0 ? (
        <Card>
          <CardContent className="flex h-32 items-center justify-center text-muted-foreground">
            You are not a member of any guild yet. Create one or use an invite link to join.
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {memberships.map((m) => (
            <Link key={m.id} href={`/g/${m.guild.slug}/dashboard`}>
              <Card className="h-full transition-colors hover:border-primary/50 hover:bg-accent">
                <CardHeader className="flex flex-row items-center gap-3 pb-2">
                  <Shield className="h-5 w-5 text-primary" />
                  <CardTitle className="text-lg font-heading tracking-wide">
                    {m.guild.name}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">
                    {m.guild.realm} &middot; {m.guild.region.toUpperCase()}
                  </p>
                  <Badge variant="outline" className="mt-2 text-xs">
                    {m.role.replace("_", " ")}
                  </Badge>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
