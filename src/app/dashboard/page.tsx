"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useAppLocale } from "@/lib/app-ui";
import {
  loadTraceabilitySnapshot,
  seedDemoData,
  type DashboardBatchStatus,
  type TraceabilitySnapshot,
} from "@/lib/traceability-db";

function Badge(props: { children: ReactNode; tone?: "green" | "amber" | "red" | "slate" }) {
  const tone = props.tone ?? "slate";
  const className =
    tone === "green"
      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
      : tone === "amber"
        ? "border-amber-200 bg-amber-50 text-amber-800"
        : tone === "red"
          ? "border-rose-200 bg-rose-50 text-rose-800"
          : "border-zinc-200 bg-zinc-100 text-zinc-700";

  return <span className={`inline-flex rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${className}`}>{props.children}</span>;
}

function StatCard(props: { label: string; value: string; note?: string }) {
  return (
    <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{props.label}</p>
      <div className="mt-2 text-3xl font-semibold text-zinc-950">{props.value}</div>
      {props.note ? <p className="mt-2 text-sm text-zinc-600">{props.note}</p> : null}
    </div>
  );
}

function statusTone(status: DashboardBatchStatus["completeness"]) {
  if (status === "green") {
    return "green";
  }

  if (status === "red") {
    return "red";
  }

  return "amber";
}

function qcTone(result: DashboardBatchStatus["qcResult"]) {
  if (!result) {
    return "slate" as const;
  }

  if (result.result === "Pass") {
    return "green" as const;
  }

  if (result.result === "Partial") {
    return "amber" as const;
  }

  return "red" as const;
}

function completenessLabel(status: DashboardBatchStatus["completeness"]) {
  if (status === "green") {
    return "Fully linked";
  }

  if (status === "red") {
    return "Broken chain";
  }

  return "Partially linked";
}

function buildDashboardSnapshot(snapshot: TraceabilitySnapshot) {
  const suppliersById = new Map(snapshot.suppliers.map((supplier) => [supplier.id, supplier]));
  const rawMaterialLotsById = new Map(snapshot.rawMaterialLots.map((lot) => [lot.id, lot]));
  const machinesById = new Map(snapshot.machines.map((machine) => [machine.id, machine]));
  const shiftsById = new Map(snapshot.shifts.map((shift) => [shift.id, shift]));
  const qcResultsByBatchId = new Map(
    snapshot.qcResults.filter((qcResult) => Boolean(qcResult.batchId)).map((qcResult) => [qcResult.batchId as string, qcResult]),
  );

  const dispatchOrdersByBatchId = new Map<string, typeof snapshot.dispatchOrders>();

  for (const dispatchOrder of snapshot.dispatchOrders) {
    for (const batchId of dispatchOrder.batchIds) {
      const existingOrders = dispatchOrdersByBatchId.get(batchId) ?? [];
      existingOrders.push(dispatchOrder);
      dispatchOrdersByBatchId.set(batchId, existingOrders);
    }
  }

  const batchStatuses = snapshot.productionBatches.map<DashboardBatchStatus>((batch) => {
    const machine = batch.machineId ? machinesById.get(batch.machineId) ?? null : null;
    const shift = batch.shiftId ? shiftsById.get(batch.shiftId) ?? null : null;
    const qcResult = qcResultsByBatchId.get(batch.id) ?? null;
    const rawMaterialLots = batch.rawMaterialLotIds
      .map((lotId) => rawMaterialLotsById.get(lotId) ?? null)
      .filter((lot): lot is NonNullable<typeof lot> => Boolean(lot));
    const dispatchOrders = dispatchOrdersByBatchId.get(batch.id) ?? [];

    const hasAllRawLots = batch.rawMaterialLotIds.length > 0 && rawMaterialLots.length === batch.rawMaterialLotIds.length;
    const hasAllSuppliers = rawMaterialLots.every((lot) => Boolean(lot.supplierId) && Boolean(suppliersById.get(lot.supplierId as string)));
    const hasMachine = Boolean(machine);
    const hasShift = Boolean(shift);
    const hasQc = Boolean(qcResult);
    const hasDispatch = dispatchOrders.length > 0;

    let completeness: DashboardBatchStatus["completeness"] = "yellow";

    if (hasMachine && hasShift && hasAllRawLots && hasAllSuppliers && hasQc && hasDispatch) {
      completeness = "green";
    } else if (!hasQc || !hasAllRawLots || !hasDispatch || !hasMachine || !hasShift) {
      completeness = "red";
    }

    return {
      batch,
      machine,
      shift,
      qcResult,
      rawMaterialLots,
      dispatchOrders,
      rawMaterialLotCount: rawMaterialLots.length,
      dispatchOrderCount: dispatchOrders.length,
      completeness,
    };
  });

  const fullyTraceableCount = batchStatuses.filter((status) => status.completeness === "green").length;
  const qcPassCount = snapshot.qcResults.filter((qcResult) => qcResult.result === "Pass").length;
  const qcResultCount = snapshot.qcResults.length;
  const totalUnitsDispatched = snapshot.dispatchOrders.reduce((total, dispatchOrder) => total + dispatchOrder.quantity, 0);

  return {
    totalBatches: snapshot.productionBatches.length,
    fullyTraceableCount,
    qcPassCount,
    qcResultCount,
    totalUnitsDispatched,
    batchStatuses,
  };
}

export default function DashboardPage() {
  const { t } = useAppLocale();
  const [data, setData] = useState<ReturnType<typeof buildDashboardSnapshot> | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        await seedDemoData();
        const snapshot = await loadTraceabilitySnapshot();
        const dashboard = buildDashboardSnapshot(snapshot);

        if (active) {
          setData(dashboard);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Failed to load dashboard data.");
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  if (error) {
    return (
      <main className="min-h-screen bg-white px-6 py-10 text-zinc-900">
        <p className="text-sm font-medium text-red-700">{error}</p>
      </main>
    );
  }

  if (!data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-white px-6 text-zinc-900">
        <p className="text-sm text-zinc-600">{t("loadingDashboard")}</p>
      </main>
    );
  }

  const fullyTraceableRate = data.totalBatches > 0 ? (data.fullyTraceableCount / data.totalBatches) * 100 : 0;
  const qcPassRate = data.qcResultCount > 0 ? (data.qcPassCount / data.qcResultCount) * 100 : 0;

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Dashboard</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{t("dashboardTitle")}</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">{t("dashboardSubtitle")}</p>
        </header>

        <section className="grid gap-4 lg:grid-cols-4">
          <StatCard label="Total batches" value={data.totalBatches.toString()} note="All seeded production batches" />
          <StatCard label={t("fullyTraceable")} value={`${fullyTraceableRate.toFixed(0)}%`} note={`${data.fullyTraceableCount} batches fully linked end-to-end`} />
          <StatCard label={t("qcPassRate")} value={`${qcPassRate.toFixed(0)}%`} note={`${data.qcPassCount} passes across ${data.qcResultCount} QC results`} />
          <StatCard label={t("totalUnitsDispatched")} value={data.totalUnitsDispatched.toLocaleString()} note="Sum of all seeded dispatch orders" />
        </section>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("batchTable")}</p>
              <h2 className="mt-1 text-lg font-semibold text-zinc-950">Traceability by production batch</h2>
            </div>
            <Badge tone="slate">Green = fully linked · Yellow = partial · Red = broken</Badge>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-zinc-200">
            <table className="min-w-full border-collapse text-sm text-zinc-900">
              <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
                <tr>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">Batch Number</th>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">Machine</th>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">Shift</th>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">QC Result</th>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">Raw Lot Count</th>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">Dispatch Order Count</th>
                  <th className="border-b border-zinc-200 px-4 py-3 font-medium">Completeness</th>
                </tr>
              </thead>
              <tbody>
                {data.batchStatuses.map((status) => (
                  <tr key={status.batch.id} className="align-top odd:bg-white even:bg-zinc-50/60">
                    <td className="border-b border-zinc-100 px-4 py-3 font-medium">{status.batch.batchNumber}</td>
                    <td className="border-b border-zinc-100 px-4 py-3">
                      {status.machine ? `${status.machine.name} (${status.machine.productionLine})` : "Not recorded"}
                    </td>
                    <td className="border-b border-zinc-100 px-4 py-3">{status.shift ? status.shift.name : "Not recorded"}</td>
                    <td className="border-b border-zinc-100 px-4 py-3">
                      {status.qcResult ? (
                        <Badge tone={qcTone(status.qcResult)}>
                          {status.qcResult.result}
                        </Badge>
                      ) : (
                        <Badge tone="slate">Not recorded</Badge>
                      )}
                    </td>
                    <td className="border-b border-zinc-100 px-4 py-3">{status.rawMaterialLotCount}</td>
                    <td className="border-b border-zinc-100 px-4 py-3">{status.dispatchOrderCount}</td>
                    <td className="border-b border-zinc-100 px-4 py-3">
                      <Badge tone={statusTone(status.completeness)}>{completenessLabel(status.completeness)}</Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}