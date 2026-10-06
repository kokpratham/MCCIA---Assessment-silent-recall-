"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import DemoScanPicker from "@/components/demo-scan-picker";
import {
  createDispatchOrder,
  loadTraceabilitySnapshot,
  seedDemoData,
  type ProductionBatch,
} from "@/lib/traceability-db";
import { useAppLocale } from "@/lib/app-ui";
import { incrementPendingChangeCount } from "@/lib/sync-queue";

export default function DispatchEntryPage() {
  const router = useRouter();
  const { t } = useAppLocale();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [orderNumber, setOrderNumber] = useState("");
  const [batchIds, setBatchIds] = useState<string[]>([]);
  const [clientName, setClientName] = useState("");
  const [dispatchDate, setDispatchDate] = useState("");
  const [quantity, setQuantity] = useState("0");
  const [destination, setDestination] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      await seedDemoData();
      const snapshot = await loadTraceabilitySnapshot();

      if (!active) {
        return;
      }

      setBatches(snapshot.productionBatches);
      setBatchIds(snapshot.productionBatches.slice(0, 1).map((batch) => batch.id));
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (batchIds.length === 0) {
      setMessage("Select at least one batch.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const record = await createDispatchOrder({
        orderNumber,
        batchIds,
        clientName,
        dispatchDate,
        quantity: Number(quantity),
        destination,
      });

      incrementPendingChangeCount();
      router.push(`/tag/dispatch/${record.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save record.");
    } finally {
      setSaving(false);
    }
  }

  function toggleBatch(batchId: string) {
    setBatchIds((current) =>
      current.includes(batchId) ? current.filter((id) => id !== batchId) : [...current, batchId],
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("dispatchTitle")}</h1>
          <p className="text-sm text-zinc-600">Create a dispatch order locally and link the batches that went out to the client.</p>
        </header>

        <form className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex items-center justify-end">
            <DemoScanPicker
              options={batches.map((batch) => ({ value: batch.id, label: `${batch.batchNumber} (${batch.id})` }))}
              onPick={toggleBatch}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldOrderNumber")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={orderNumber}
                onChange={(event) => setOrderNumber(event.target.value)}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldBatchIds")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                multiple
                size={5}
                value={batchIds}
                onChange={(event) => setBatchIds(Array.from(event.target.selectedOptions, (option) => option.value))}
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} ({batch.id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">Hold Ctrl or Cmd to select multiple batches.</p>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldClientName")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={clientName}
                onChange={(event) => setClientName(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldDispatchDate")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                type="date"
                value={dispatchDate}
                onChange={(event) => setDispatchDate(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldQuantity")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                min="0"
                required
                type="number"
                value={quantity}
                onChange={(event) => setQuantity(event.target.value)}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldDestination")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={destination}
                onChange={(event) => setDestination(event.target.value)}
              />
            </label>
          </div>

          {message ? <p className="text-sm font-medium text-rose-700">{message}</p> : null}

          <div className="flex items-center justify-end gap-3">
            <button
              className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={loading || saving}
              type="submit"
            >
              {t("saveRecord")}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}