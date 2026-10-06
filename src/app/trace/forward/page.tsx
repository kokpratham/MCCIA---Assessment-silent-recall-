"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import DemoScanPicker from "@/components/demo-scan-picker";
import {
  getForwardTraceLookupOptions,
  loadTraceabilitySnapshot,
  resolveForwardTraceFromSnapshot,
  seedDemoData,
  type ForwardTraceResolution,
  type TraceabilitySnapshot,
} from "@/lib/traceability-db";
import { useAppLocale } from "@/lib/app-ui";

const NOT_RECORDED = "Not recorded";

function formatDate(value: string | null | undefined) {
  if (!value) {
    return NOT_RECORDED;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium" }).format(date);
}

function Badge(props: { children: ReactNode; tone?: "slate" | "green" | "amber" | "red" }) {
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

function InfoRow(props: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <div className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{props.label}</div>
      <div className="text-sm text-zinc-900">{props.value}</div>
    </div>
  );
}

function SourceCard(props: { resolution: ForwardTraceResolution; snapshot: TraceabilitySnapshot }) {
  const { resolution, snapshot } = props;
  const sourceSupplier = resolution.sourceRawMaterialLot?.supplierId
    ? snapshot.suppliers.find((supplier) => supplier.id === resolution.sourceRawMaterialLot?.supplierId) ?? null
    : null;

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Source</p>
          <h2 className="mt-1 text-2xl font-semibold text-zinc-950">{resolution.sourceLabel}</h2>
          <p className="mt-2 text-sm text-zinc-600">Resolved from {resolution.matchedBy === "rawMaterialLotId" ? "raw material lot" : "production batch"} ID {resolution.requestedValue}</p>
        </div>
        <Badge tone="green">Local lookup</Badge>
      </div>

      <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <InfoRow label="Source batch" value={resolution.sourceBatch ? resolution.sourceBatch.batchNumber : NOT_RECORDED} />
        <InfoRow label="Source lot" value={resolution.sourceRawMaterialLot ? resolution.sourceRawMaterialLot.lotNumber : NOT_RECORDED} />
        <InfoRow label="Downstream batches" value={resolution.downstreamBatches.length} />
        <InfoRow label="Affected shipments" value={resolution.dispatchOrders.length} />
      </dl>

      <div className="mt-6 flex flex-wrap gap-3">
        <Badge tone={sourceSupplier ? "green" : "red"}>Supplier: {sourceSupplier ? sourceSupplier.name : NOT_RECORDED}</Badge>
        <Badge tone={resolution.sourceBatch && resolution.sourceBatch.rawMaterialLotIds.some((lotId) => !snapshot.rawMaterialLots.some((lot) => lot.id === lotId)) ? "red" : "green"}>
          Missing raw lots: {resolution.sourceBatch ? resolution.sourceBatch.rawMaterialLotIds.filter((lotId) => !snapshot.rawMaterialLots.some((lot) => lot.id === lotId)).length : 0}
        </Badge>
      </div>

      <div className="mt-6 grid gap-4 xl:grid-cols-2">
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Upstream source lot</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <InfoRow label="Lot number" value={resolution.sourceRawMaterialLot ? resolution.sourceRawMaterialLot.lotNumber : NOT_RECORDED} />
            <InfoRow label="Material type" value={resolution.sourceRawMaterialLot ? resolution.sourceRawMaterialLot.materialType : NOT_RECORDED} />
            <InfoRow label="Received date" value={formatDate(resolution.sourceRawMaterialLot?.receivedDate)} />
            <InfoRow label="Quantity" value={resolution.sourceRawMaterialLot ? resolution.sourceRawMaterialLot.quantity : NOT_RECORDED} />
            <InfoRow label="Supplier ID" value={resolution.sourceRawMaterialLot?.supplierId ?? NOT_RECORDED} />
            <InfoRow label="Supplier" value={sourceSupplier ? sourceSupplier.name : NOT_RECORDED} />
          </div>
        </div>

        {resolution.sourceBatch ? (
          <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">Batch chain</p>
            <div className="mt-3 space-y-3">
              {resolution.sourceBatch.rawMaterialLotIds.length > 0 ? (
                resolution.sourceBatch.rawMaterialLotIds.map((lotId) => {
                  const matchingLot = snapshot.rawMaterialLots.find((lot) => lot.id === lotId) ?? null;
                  const matchingSupplier = matchingLot?.supplierId
                    ? snapshot.suppliers.find((supplier) => supplier.id === matchingLot.supplierId) ?? null
                    : null;

                  return (
                    <div key={lotId} className="rounded-2xl border border-zinc-200 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-zinc-950">
                          {matchingLot ? matchingLot.lotNumber : `${lotId} (${NOT_RECORDED})`}
                        </h3>
                        <Badge tone={matchingLot ? "green" : "slate"}>{matchingLot ? "Recorded" : "Not recorded"}</Badge>
                      </div>
                      <div className="mt-3 grid gap-3 sm:grid-cols-2">
                        <InfoRow label="Lot ID" value={matchingLot ? matchingLot.id : lotId} />
                        <InfoRow label="Supplier" value={matchingSupplier ? matchingSupplier.name : NOT_RECORDED} />
                      </div>
                    </div>
                  );
                })
              ) : (
                <p className="text-sm text-zinc-600">{NOT_RECORDED}</p>
              )}
            </div>
          </div>
        ) : null}
      </div>
    </section>
  );
}

function OrdersTable(props: { orders: ForwardTraceResolution["dispatchOrders"] }) {
  const { t } = useAppLocale();

  return (
    <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("downstreamShipments")}</p>
          <h2 className="mt-1 text-lg font-semibold text-zinc-950">{t("affectedClients")}</h2>
        </div>
        <Badge tone={props.orders.length > 0 ? "green" : "slate"}>{props.orders.length} orders</Badge>
      </div>

      <div className="mt-5 overflow-x-auto rounded-2xl border border-zinc-200">
        <table className="min-w-full border-collapse text-sm text-zinc-900">
          <thead className="bg-zinc-50 text-left text-xs uppercase tracking-wide text-zinc-500">
            <tr>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Order Number</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Client</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Dispatch Date</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Quantity</th>
              <th className="border-b border-zinc-200 px-4 py-3 font-medium">Destination</th>
            </tr>
          </thead>
          <tbody>
            {props.orders.length === 0 ? (
              <tr>
                <td className="px-4 py-4 text-sm text-zinc-600" colSpan={5}>
                  No downstream dispatch orders were found.
                </td>
              </tr>
            ) : (
              props.orders.map((order) => (
                <tr key={order.id} className="odd:bg-white even:bg-zinc-50/60">
                  <td className="border-b border-zinc-100 px-4 py-3 font-medium">{order.orderNumber}</td>
                  <td className="border-b border-zinc-100 px-4 py-3">{order.clientName}</td>
                  <td className="border-b border-zinc-100 px-4 py-3">{formatDate(order.dispatchDate)}</td>
                  <td className="border-b border-zinc-100 px-4 py-3">{order.quantity}</td>
                  <td className="border-b border-zinc-100 px-4 py-3">{order.destination}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export default function ForwardTracePage() {
  const { t } = useAppLocale();
  const [snapshot, setSnapshot] = useState<TraceabilitySnapshot | null>(null);
  const [selectedValue, setSelectedValue] = useState("");
  const [resolution, setResolution] = useState<ForwardTraceResolution | null>(null);
  const [message, setMessage] = useState("Select a lot or batch to trace forward.");
  const [loading, setLoading] = useState(true);
  const [lookupDurationMs, setLookupDurationMs] = useState<number | null>(null);

  function resolveTrace(value: string, currentSnapshot: TraceabilitySnapshot) {
    const startedAt = performance.now();
    const nextResolution = resolveForwardTraceFromSnapshot(currentSnapshot, value);
    const elapsed = performance.now() - startedAt;

    setLookupDurationMs(elapsed);

    if (!nextResolution) {
      setResolution(null);
      setMessage("No lot or batch matched that selection.");
      return;
    }

    setResolution(nextResolution);
    setMessage(`Resolved locally in ${elapsed.toFixed(1)} ms from IndexedDB.`);
  }

  useEffect(() => {
    let active = true;

    async function loadData() {
      try {
        const searchParams = new URLSearchParams(window.location.search);
        const autoResolveValue = searchParams.get("item") ?? searchParams.get("lot") ?? searchParams.get("batch") ?? "";
        await seedDemoData();
        const nextSnapshot = await loadTraceabilitySnapshot();

        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        const firstOption = getForwardTraceLookupOptions(nextSnapshot)[0]?.value ?? "";
        const nextSelectedValue = autoResolveValue.trim() || firstOption;

        setSelectedValue(nextSelectedValue);
        setMessage("Ready. Choose a raw lot or batch to trace forward.");

        if (autoResolveValue.trim()) {
          resolveTrace(nextSelectedValue, nextSnapshot);
        }
      } catch (caughtError) {
        if (active) {
          setMessage(caughtError instanceof Error ? caughtError.message : "Failed to load IndexedDB data.");
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, []);

  const lookupOptions = snapshot ? getForwardTraceLookupOptions(snapshot) : [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot) {
      return;
    }

    resolveTrace(selectedValue, snapshot);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Forward trace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{t("forwardTitle")}</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">{t("forwardSubtitle")}</p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleSubmit}>
            <label className="flex-1 space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldLotOrBatch")}</span>
              <DemoScanPicker
                options={lookupOptions.map((option) => ({ value: option.value, label: option.label }))}
                onPick={setSelectedValue}
              />
              <input
                list="forward-trace-options"
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-950"
                disabled={loading || lookupOptions.length === 0}
                placeholder="Start typing an existing lot or batch ID"
                value={selectedValue}
                onChange={(event) => setSelectedValue(event.target.value)}
              />
              <datalist id="forward-trace-options">
                {lookupOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </datalist>
            </label>

            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={loading || lookupOptions.length === 0}
              type="submit"
            >
              {t("resolveImpact")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{message}</span>
            {lookupDurationMs !== null ? <Badge tone="slate">{lookupDurationMs.toFixed(1)} ms</Badge> : null}
            <Badge tone="slate">Client-side only</Badge>
            <Badge tone="slate">No network calls</Badge>
          </div>
        </section>

        {!resolution ? (
          <section className="rounded-3xl border border-dashed border-zinc-300 bg-white/70 p-8 text-sm text-zinc-600 shadow-sm">
            {loading ? "Loading seeded IndexedDB data..." : "Pick a lot or batch, then resolve the downstream impact."}
          </section>
        ) : (
          <div className="space-y-6">
            <SourceCard resolution={resolution} snapshot={snapshot!} />
            <OrdersTable orders={resolution.dispatchOrders} />
          </div>
        )}
      </div>
    </main>
  );
}