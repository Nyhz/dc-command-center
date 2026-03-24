"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { RefreshCw } from "lucide-react";

export function SyncRosterButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch("/api/roster/sync", { method: "POST" });
      const data = await res.json();

      if (!res.ok) {
        setResult(`Error: ${data.error}`);
      } else {
        setResult(`Updated ${data.updated} of ${data.total} characters`);
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
        onClick={handleSync}
        disabled={loading}
      >
        <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
        {loading ? "Syncing..." : "Sync Profiles"}
      </Button>
      {result && (
        <span className="text-xs text-muted-foreground">{result}</span>
      )}
    </div>
  );
}
