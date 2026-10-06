const PENDING_KEY = "silent-recall-traceability-pending-changes";

export function getPendingChangeCount() {
  if (typeof window === "undefined") {
    return 0;
  }

  const storedCount = window.localStorage.getItem(PENDING_KEY);
  const parsedCount = storedCount ? Number.parseInt(storedCount, 10) : 0;

  return Number.isFinite(parsedCount) && parsedCount > 0 ? parsedCount : 0;
}

export function setPendingChangeCount(count: number) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(PENDING_KEY, String(Math.max(0, Math.floor(count))));
  window.dispatchEvent(new Event("storage"));
}

export function incrementPendingChangeCount() {
  setPendingChangeCount(getPendingChangeCount() + 1);
}

export function resetPendingChangeCount() {
  setPendingChangeCount(0);
}