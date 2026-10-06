"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";

import DemoScanPicker from "@/components/demo-scan-picker";
import {
  createProductionBatch,
  loadTraceabilitySnapshot,
  seedDemoData,
  type Machine,
  type RawMaterialLot,
  type Shift,
} from "@/lib/traceability-db";
import { useAppLocale } from "@/lib/app-ui";
import { incrementPendingChangeCount } from "@/lib/sync-queue";

export default function BatchEntryPage() {
  const router = useRouter();
  const { t } = useAppLocale();
  const [machines, setMachines] = useState<Machine[]>([]);
  const [shifts, setShifts] = useState<Shift[]>([]);
  const [rawMaterialLots, setRawMaterialLots] = useState<RawMaterialLot[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");

  const [batchNumber, setBatchNumber] = useState("");
  const [rawMaterialLotIds, setRawMaterialLotIds] = useState<string[]>([]);
  const [machineId, setMachineId] = useState("");
  const [shiftId, setShiftId] = useState("");
  const [operatorName, setOperatorName] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [unitsProduced, setUnitsProduced] = useState("0");

  useEffect(() => {
    let active = true;

    async function loadData() {
      await seedDemoData();
      const snapshot = await loadTraceabilitySnapshot();

      if (!active) {
        return;
      }

      setMachines(snapshot.machines);
      setShifts(snapshot.shifts);
      setRawMaterialLots(snapshot.rawMaterialLots);
      setMachineId(snapshot.machines[0]?.id ?? "");
      setShiftId(snapshot.shifts[0]?.id ?? "");
      setRawMaterialLotIds(snapshot.rawMaterialLots.slice(0, 1).map((lot) => lot.id));
      setLoading(false);
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (rawMaterialLotIds.length === 0) {
      setMessage("Select at least one raw material lot.");
      return;
    }

    setSaving(true);
    setMessage("");

    try {
      const record = await createProductionBatch({
        batchNumber,
        rawMaterialLotIds,
        machineId: machineId || undefined,
        shiftId: shiftId || undefined,
        operatorName,
        startTime,
        endTime,
        unitsProduced: Number(unitsProduced),
      });

      incrementPendingChangeCount();
      router.push(`/tag/batch/${record.id}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Failed to save record.");
    } finally {
      setSaving(false);
    }
  }

  function toggleLot(lotId: string) {
    setRawMaterialLotIds((current) =>
      current.includes(lotId) ? current.filter((id) => id !== lotId) : [...current, lotId],
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto w-full max-w-4xl space-y-6">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("batchTitle")}</h1>
          <p className="text-sm text-zinc-600">
            Create a production batch locally. Link existing raw lots, machine, and shift records directly from IndexedDB.
          </p>
        </header>

        <form className="space-y-5 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm" onSubmit={handleSubmit}>
          <div className="flex items-center justify-end">
            <DemoScanPicker
              options={rawMaterialLots.map((lot) => ({ value: lot.id, label: `${lot.lotNumber} (${lot.id})` }))}
              onPick={toggleLot}
            />
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldBatchNumber")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={batchNumber}
                onChange={(event) => setBatchNumber(event.target.value)}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldRawMaterialLots")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                multiple
                size={5}
                value={rawMaterialLotIds}
                onChange={(event) => setRawMaterialLotIds(Array.from(event.target.selectedOptions, (option) => option.value))}
              >
                {rawMaterialLots.map((lot) => (
                  <option key={lot.id} value={lot.id}>
                    {lot.lotNumber} ({lot.id})
                  </option>
                ))}
              </select>
              <p className="text-xs text-zinc-500">Hold Ctrl or Cmd to select multiple lots.</p>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldMachine")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                value={machineId}
                onChange={(event) => setMachineId(event.target.value)}
              >
                <option value="">{t("notRecorded")}</option>
                {machines.map((machine) => (
                  <option key={machine.id} value={machine.id}>
                    {machine.name} ({machine.productionLine})
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldShift")}</span>
              <select
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                value={shiftId}
                onChange={(event) => setShiftId(event.target.value)}
              >
                <option value="">{t("notRecorded")}</option>
                {shifts.map((shift) => (
                  <option key={shift.id} value={shift.id}>
                    {shift.name}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldOperatorName")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                value={operatorName}
                onChange={(event) => setOperatorName(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldStartTime")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                type="datetime-local"
                value={startTime}
                onChange={(event) => setStartTime(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldEndTime")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                required
                type="datetime-local"
                value={endTime}
                onChange={(event) => setEndTime(event.target.value)}
              />
            </label>

            <label className="space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldUnitsProduced")}</span>
              <input
                className="w-full rounded-2xl border border-zinc-300 px-4 py-3 text-sm outline-none transition focus:border-zinc-950"
                min="0"
                required
                type="number"
                value={unitsProduced}
                onChange={(event) => setUnitsProduced(event.target.value)}
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