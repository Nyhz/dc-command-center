import { Badge } from "@/components/ui/badge";

const roleConfig = {
  TANK: { label: "Tank", variant: "default" as const, className: "bg-blue-600/20 text-blue-400 border-blue-600/30" },
  HEALER: { label: "Healer", variant: "default" as const, className: "bg-green-600/20 text-green-400 border-green-600/30" },
  DPS: { label: "DPS", variant: "default" as const, className: "bg-red-600/20 text-red-400 border-red-600/30" },
};

export function RoleBadge({ role }: { role: string }) {
  const config = roleConfig[role as keyof typeof roleConfig] ?? roleConfig.DPS;

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}
