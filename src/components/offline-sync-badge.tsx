"use client";

import { useEffect, useState } from "react";

import { useAppLocale } from "@/lib/app-ui";
import { getPendingChangeCount, resetPendingChangeCount } from "@/lib/sync-queue";

export default function OfflineSyncBadge() {
  const { t } = useAppLocale();
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const [syncedMessage, setSyncedMessage] = useState(false);

  useEffect(() => {
    const updateConnectionState = () => setIsOnline(window.navigator.onLine);
    const updatePendingCount = () => setPendingCount(getPendingChangeCount());

    updateConnectionState();
    updatePendingCount();

    window.addEventListener("online", updateConnectionState);
    window.addEventListener("offline", updateConnectionState);
    window.addEventListener("storage", updatePendingCount);

    return () => {
      window.removeEventListener("online", updateConnectionState);
      window.removeEventListener("offline", updateConnectionState);
      window.removeEventListener("storage", updatePendingCount);
    };
  }, []);

  async function handleSyncNow() {
    if (!isOnline || syncing) {
      return;
    }

    setSyncing(true);
    setSyncedMessage(false);

    await new Promise((resolve) => window.setTimeout(resolve, 900));
    resetPendingChangeCount();
    setPendingCount(0);
    setSyncing(false);
    setSyncedMessage(true);

    window.setTimeout(() => setSyncedMessage(false), 1500);
  }

  const statusText = isOnline
    ? t("online")
    : `${t("offline")} — ${pendingCount} ${t("changesStoredLocally")}`;

  return (
    <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-zinc-50 px-3 py-2 text-xs text-zinc-700">
      <span className={`h-2.5 w-2.5 rounded-full ${isOnline ? "bg-emerald-500" : "bg-rose-500"}`} />
      <span className="whitespace-nowrap font-medium">{syncing ? t("syncing") : syncedMessage ? t("synced") : statusText}</span>
      <button
        className="rounded-full bg-zinc-950 px-3 py-1.5 font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
        disabled={!isOnline || syncing}
        type="button"
        onClick={handleSyncNow}
      >
        {t("syncNow")}
      </button>
    </div>
  );
}