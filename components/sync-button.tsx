"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function SyncButton() {
  const router = useRouter();
  const [message, setMessage] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function sync() {
    setBusy(true);
    try {
      const response = await fetch("/api/plan/sync", { method: "POST" });
      const result = await response.json();
      setMessage(result.message ?? result.error ?? "Sync complete.");
      if (response.ok) router.refresh();
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button type="button" variant="secondary" onClick={sync} disabled={busy}>
        <RefreshCw className={`mr-2 h-4 w-4 ${busy ? "animate-spin" : ""}`} />
        Sync Now
      </Button>
      {message ? <p className="text-xs text-secondary">{message}</p> : null}
    </div>
  );
}
