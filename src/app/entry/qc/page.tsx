"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import DemoScanPicker from "@/components/demo-scan-picker";
import {
  createQCResult,
  loadTraceabilitySnapshot,
  seedDemoData,
  type ProductionBatch,
} from "@/lib/traceability-db";
import { useAppLocale } from "@/lib/app-ui";
import { incrementPendingChangeCount } from "@/lib/sync-queue";

export default function QcEntryPage() {
  const router = useRouter();
  const { t } = useAppLocale();
  const [batches, setBatches] = useState<ProductionBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [batchId, setBatchId] = useState("");
  const [inspectorName, setInspectorName] = useState("");
  const [result, setResult] = useState<"Pass" | "Fail" | "Partial">("Pass");
  const [defects, setDefects] = useState("");
  const [inspectionDate, setInspectionDate] = useState("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      await seedDemoData();
      const snapshot = await loadTraceabilitySnapshot();

      if (!active) {
        return;
      }

      setBatches(snapshot.productionBatches);
      setBatchId(snapshot.productionBatches[0]?.id ?? "");
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setSaving(true);
    setMessage("");

    try {
      const record = await createQCResult({
        batchId: batchId || undefined,
        inspectorName,
        result,
        defects: defects
          .split(",")
          .map((defect) => defect.trim())
          .filter(Boolean),
        inspectionDate,
      });

      incrementPendingChangeCount();
      router.push(`/tag/qc/${record.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save record.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("qcTitle")}</h1>
          <p className="text-sm text-zinc-600">Record a QC result directly into IndexedDB.</p>
        </header>

        <form className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex items-center justify-end">
            <DemoScanPicker
              options={batches.map((batch) => ({ value: batch.id, label: `${batch.batchNumber} (${batch.id})` }))}
              onPick={setBatchId}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldBatchNumber")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={batchId}
                onChange={(event) => setBatchId(event.target.value)}
              >
                {batches.map((batch) => (
                  <option key={batch.id} value={batch.id}>
                    {batch.batchNumber} ({batch.id})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldInspectorName")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={inspectorName}
                onChange={(event) => setInspectorName(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldResult")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                value={result}
                onChange={(event) => setResult(event.target.value as "Pass" | "Fail" | "Partial")}
              >
                <option value="Pass">Pass</option>
                <option value="Fail">Fail</option>
                <option value="Partial">Partial</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldInspectionDate")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                type="datetime-local"
                value={inspectionDate}
                onChange={(event) => setInspectionDate(event.target.value)}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldDefects")}</span>
              <textarea
                className="min-h-28 w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                placeholder="Comma-separated defects"
                value={defects}
                onChange={(event) => setDefects(event.target.value)}
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