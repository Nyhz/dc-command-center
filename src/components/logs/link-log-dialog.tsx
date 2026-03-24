"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Plus } from "lucide-react";

export function LinkLogDialog() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [reportCode, setReportCode] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    // Step 1: Link the log
    const linkRes = await fetch("/api/logs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reportCode }),
    });

    if (!linkRes.ok) {
      const data = await linkRes.json();
      setError(data.error ?? "Failed to link log");
      setLoading(false);
      return;
    }

    const log = await linkRes.json();

    // Step 2: Fetch data from WCL
    try {
      await fetch(`/api/logs/${log.reportCode}/fetch`, { method: "POST" });
    } catch {
      // Non-critical — data can be fetched later
    }

    setOpen(false);
    setReportCode("");
    setLoading(false);
    router.refresh();
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Link Log
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="font-heading">Link Warcraft Log</DialogTitle>
          <DialogDescription>
            Paste a Warcraft Logs report URL or code to import performance data.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="report-code">Report URL or Code</Label>
            <Input
              id="report-code"
              value={reportCode}
              onChange={(e) => setReportCode(e.target.value)}
              placeholder="e.g. rwG81bzxZvg3mDN9 or full URL"
              required
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" disabled={loading || !reportCode} className="w-full">
            {loading ? "Linking & fetching data..." : "Link Log"}
          </Button>
        </form>
      </DialogContent>
    </Dialog>
  );
}
