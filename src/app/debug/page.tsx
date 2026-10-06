"use client";

import { useEffect, useState, type ReactNode } from "react";

import { useAppLocale } from "@/lib/app-ui";
import {
  loadTraceabilitySnapshot,
  seedDemoData,
  type DispatchOrder,
  type Machine,
  type ProductionBatch,
  type QCResult,
  type RawMaterialLot,
  type Shift,
  type Supplier,
} from "@/lib/traceability-db";

type Snapshot = Awaited<ReturnType<typeof loadTraceabilitySnapshot>>;

function displayValue(value: unknown): ReactNode {
  if (Array.isArray(value)) {
    return value.length > 0 ? value.join(", ") : "-";
  }

  if (value === null || value === undefined || value === "") {
    return "-";
  }

  return String(value);
}

function Section<T extends { id: string }>(props: {
  title: string;
  rows: T[];
  columns: Array<{ key: keyof T; label: string }>;
}) {
  const { title, rows, columns } = props;

  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-zinc-900">
        {title} ({rows.length})
      </h2>
      <div className="overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full border-collapse text-sm text-zinc-900">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              {columns.map((column) => (
                <th key={String(column.key)} className="border-b border-zinc-200 px-4 py-3 font-medium">
                  {column.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id} className="align-top odd:bg-white even:bg-zinc-50/60">
                {columns.map((column) => (
                  <td key={String(column.key)} className="border-b border-zinc-100 px-4 py-3 whitespace-nowrap">
                    {displayValue(row[column.key])}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function DebugPage() {
  const { t } = useAppLocale();
  const [data, setData] = useState<Snapshot | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        await seedDemoData();
        const snapshot = await loadTraceabilitySnapshot();

        if (active) {
          setData(snapshot);
        }
      } catch (caughtError) {
        if (active) {
          setError(caughtError instanceof Error ? caughtError.message : "Failed to load database snapshot.");
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
        <p className="text-sm text-zinc-600">Loading seeded tables...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <header className="space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">{t("debugTitle")}</h1>
          <p className="text-sm text-zinc-600">{t("debugSubtitle")}</p>
        </header>

        <Section<Supplier>
          title="Suppliers"
          rows={data.suppliers}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "contactInfo", label: "Contact Info" },
          ]}
        />

        <Section<RawMaterialLot>
          title="Raw Material Lots"
          rows={data.rawMaterialLots}
          columns={[
            { key: "id", label: "ID" },
            { key: "lotNumber", label: "Lot Number" },
            { key: "supplierId", label: "Supplier ID" },
            { key: "materialType", label: "Material Type" },
            { key: "receivedDate", label: "Received Date" },
            { key: "quantity", label: "Quantity" },
          ]}
        />

        <Section<Machine>
          title="Machines"
          rows={data.machines}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
            { key: "productionLine", label: "Production Line" },
          ]}
        />

        <Section<Shift>
          title="Shifts"
          rows={data.shifts}
          columns={[
            { key: "id", label: "ID" },
            { key: "name", label: "Name" },
          ]}
        />

        <Section<ProductionBatch>
          title="Production Batches"
          rows={data.productionBatches}
          columns={[
            { key: "id", label: "ID" },
            { key: "batchNumber", label: "Batch Number" },
            { key: "rawMaterialLotIds", label: "Raw Material Lot IDs" },
            { key: "machineId", label: "Machine ID" },
            { key: "shiftId", label: "Shift ID" },
            { key: "operatorName", label: "Operator" },
            { key: "startTime", label: "Start Time" },
            { key: "endTime", label: "End Time" },
            { key: "unitsProduced", label: "Units Produced" },
          ]}
        />

        <Section<QCResult>
          title="QC Results"
          rows={data.qcResults}
          columns={[
            { key: "id", label: "ID" },
            { key: "batchId", label: "Batch ID" },
            { key: "inspectorName", label: "Inspector" },
            { key: "result", label: "Result" },
            { key: "defects", label: "Defects" },
            { key: "inspectionDate", label: "Inspection Date" },
          ]}
        />

        <Section<DispatchOrder>
          title="Dispatch Orders"
          rows={data.dispatchOrders}
          columns={[
            { key: "id", label: "ID" },
            { key: "orderNumber", label: "Order Number" },
            { key: "batchIds", label: "Batch IDs" },
            { key: "clientName", label: "Client" },
            { key: "dispatchDate", label: "Dispatch Date" },
            { key: "quantity", label: "Quantity" },
            { key: "destination", label: "Destination" },
          ]}
        />
      </div>
    </main>
  );
}