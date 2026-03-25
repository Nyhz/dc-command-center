import { auth } from "@/auth";
import { resolveGuild } from "@/lib/guild-helpers";
import { redirect } from "next/navigation";
import { GuildProvider } from "@/lib/guild-context";

export const dynamic = "force-dynamic";

export default async function GuildLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ guildSlug: string }>;
}) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const { guildSlug } = await params;
  const ctx = await resolveGuild(guildSlug, session.user.id);
  if (!ctx) redirect("/guilds");

  const { guild, membership } = ctx;

  return (
    <GuildProvider
      guild={{
        id: guild.id,
        name: guild.name,
        slug: guild.slug,
        realm: guild.realm,
        region: guild.region,
      }}
      membership={{
        role: membership.role,
      }}
    >
      {children}
    </GuildProvider>
  );
}
