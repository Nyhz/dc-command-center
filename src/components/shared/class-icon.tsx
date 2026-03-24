import { CLASS_COLORS } from "@/lib/constants";

export function ClassIcon({ className }: { className: string }) {
  const color = CLASS_COLORS[className] ?? "#FFFFFF";

  return (
    <span
      className="inline-block h-3 w-3 rounded-full"
      style={{ backgroundColor: color }}
      title={className}
    />
  );
}
