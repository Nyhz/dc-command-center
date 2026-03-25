"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { useGuild } from "@/lib/guild-context";
import { RefreshCw } from "lucide-react";

export function RefetchButton({ reportCode }: { reportCode: string }) {
  const router = useRouter();
  const { guild } = useGuild();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleRefetch() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch(`/api/g/${guild.slug}/logs/${reportCode}/fetch`, { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(`Updated: ${data.fetched} performances across ${data.fights} fights`);
        router.refresh();
      }
    } catch {
      setResult("Network error");
    }

    setLoading(false);
    setTimeout(() => setResult(null), 5000);
  }

  return (
    <div className="flex items-center gap-2">
      <Button
        size="sm"
        variant="outline"
        className="gap-2"
        onClick={handleRefetch}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Fetching..." : "Re-fetch"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
