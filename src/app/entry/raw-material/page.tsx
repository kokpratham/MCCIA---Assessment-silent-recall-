"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import DemoScanPicker from "@/components/demo-scan-picker";
import {
  createRawMaterialLot,
  loadTraceabilitySnapshot,
  seedDemoData,
  type Supplier,
} from "@/lib/traceability-db";
import { useAppLocale } from "@/lib/app-ui";
import { incrementPendingChangeCount } from "@/lib/sync-queue";

export default function RawMaterialEntryPage() {
  const router = useRouter();
  const { t } = useAppLocale();
  const [suppliers, setSuppliers] = useState<Supplier[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [supplierId, setSupplierId] = useState("");
  const [lotNumber, setLotNumber] = useState("");
  const [materialType, setMaterialType] = useState("");
  const [receivedDate, setReceivedDate] = useState("");
  const [quantity, setQuantity] = useState("0");

  useEffect(() => {
    let active = true;

    async function loadData() {
      await seedDemoData();
      const snapshot = await loadTraceabilitySnapshot();

      if (!active) {
        return;
      }

      setSuppliers(snapshot.suppliers);
      setSupplierId(snapshot.suppliers[0]?.id ?? "");
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
      const record = await createRawMaterialLot({
        supplierId: supplierId || undefined,
        lotNumber,
        materialType,
        receivedDate,
        quantity: Number(quantity),
      });

      incrementPendingChangeCount();
      router.push(`/tag/raw-material/${record.id}`);
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
          <h1 className="text-3xl font-semibold tracking-tight">{t("rawMaterialTitle")}</h1>
          <p className="text-sm text-zinc-600">
            Create a lot locally in IndexedDB. Optional supplier links can be left unlinked for gap testing.
          </p>
        </header>

        <form className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex items-center justify-end">
            <DemoScanPicker
              options={suppliers.map((supplier) => ({ value: supplier.id, label: `${supplier.name} (${supplier.id})` }))}
              onPick={setSupplierId}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldLotNumber")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={lotNumber}
                onChange={(event) => setLotNumber(event.target.value)}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldSupplier")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                value={supplierId}
                onChange={(event) => setSupplierId(event.target.value)}
              >
                <option value="">{t("notRecorded")}</option>
                {suppliers.map((supplier) => (
                  <option key={supplier.id} value={supplier.id}>
                    {supplier.name} ({supplier.id})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldMaterialType")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={materialType}
                onChange={(event) => setMaterialType(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldReceivedDate")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                type="date"
                value={receivedDate}
                onChange={(event) => setReceivedDate(event.target.value)}
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