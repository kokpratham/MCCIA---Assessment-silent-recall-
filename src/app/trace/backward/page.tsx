"use client";

import { useEffect, useState, type FormEvent, type ReactNode } from "react";

import DemoScanPicker from "@/components/demo-scan-picker";
import {
  getDispatchOrderLookupOptions,
  loadTraceabilitySnapshot,
  resolveBackwardTraceFromSnapshot,
  seedDemoData,
  type BackwardTraceResolution,
  type TraceabilitySnapshot,
} from "@/lib/traceability-db";
import { useAppLocale } from "@/lib/app-ui";

const NOT_RECORDED = "Not recorded";

function formatDateTime(value: string | null | undefined) {
  if (!value) {
    return NOT_RECORDED;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

function formatDate(value: string | null | undefined) {
  if (!value) {
    return NOT_RECORDED;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
  }).format(date);
}

function valueOrNotRecorded(value: string | number | null | undefined) {
  if (value === null || value === undefined || value === "") {
    return NOT_RECORDED;
  }

  return String(value);
}

function resultTone(result: string | null) {
  if (!result) {
    return "muted";
  }

  if (result === "Pass") {
    return "success";
  }

  if (result === "Partial") {
    return "warning";
  }

  if (result === "Fail") {
    return "danger";
  }

  return "muted";
}

function toneClass(tone: "success" | "warning" | "danger" | "muted") {
  switch (tone) {
    case "success":
      return "border-emerald-200 bg-emerald-50 text-emerald-800";
    case "warning":
      return "border-amber-200 bg-amber-50 text-amber-800";
    case "danger":
      return "border-rose-200 bg-rose-50 text-rose-800";
    default:
      return "border-zinc-200 bg-zinc-100 text-zinc-700";
  }
}

function Badge(props: { tone?: "success" | "warning" | "danger" | "muted"; children: ReactNode }) {
  const tone = props.tone ?? "muted";

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] ${toneClass(tone)}`}>
      {props.children}
    </span>
  );
}

function InfoRow(props: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <dt className="text-[11px] font-semibold uppercase tracking-[0.16em] text-zinc-500">{props.label}</dt>
      <dd className="text-sm text-zinc-900">{props.value}</dd>
    </div>
  );
}

function SectionCard(props: {
  eyebrow: string;
  title: string;
  subtitle?: string;
  badge?: ReactNode;
  children: ReactNode;
  accent?: "emerald" | "amber" | "rose" | "slate";
}) {
  const accent = props.accent ?? "slate";
  const accentClass = {
    emerald: "bg-emerald-500",
    amber: "bg-amber-500",
    rose: "bg-rose-500",
    slate: "bg-slate-500",
  }[accent];

  return (
    <article className="relative pl-8">
      <span className={`absolute left-0 top-7 h-3.5 w-3.5 rounded-full ring-4 ring-white ${accentClass}`} />
      <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{props.eyebrow}</p>
            <h2 className="text-lg font-semibold text-zinc-950">{props.title}</h2>
            {props.subtitle ? <p className="text-sm text-zinc-600">{props.subtitle}</p> : null}
          </div>
          {props.badge}
        </div>
        <div className="mt-5">{props.children}</div>
      </div>
    </article>
  );
}

function batchStatus(batch: BackwardTraceResolution["batches"][number]) {
  return batch.productionBatch ? <Badge tone="success">Recorded</Badge> : <Badge tone="muted">Not recorded</Badge>;
}

export default function BackwardTracePage() {
  const { t } = useAppLocale();
  const [snapshot, setSnapshot] = useState<TraceabilitySnapshot | null>(null);
  const [selectedDispatchOrder, setSelectedDispatchOrder] = useState("");
  const [resolution, setResolution] = useState<BackwardTraceResolution | null>(null);
  const [message, setMessage] = useState("Select a dispatch order and resolve the backward chain.");
  const [loading, setLoading] = useState(true);
  const [lookupDurationMs, setLookupDurationMs] = useState<number | null>(null);
  function resolveTrace(value: string, currentSnapshot: TraceabilitySnapshot) {
    const startedAt = performance.now();
    const nextResolution = resolveBackwardTraceFromSnapshot(currentSnapshot, value);
    const elapsed = performance.now() - startedAt;

    setLookupDurationMs(elapsed);

    if (!nextResolution) {
      setResolution(null);
      setMessage("No dispatch order matched that selection.");
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
        const autoResolveValue = searchParams.get("order") ?? searchParams.get("dispatchOrder") ?? "";
        await seedDemoData();
        const nextSnapshot = await loadTraceabilitySnapshot();

        if (!active) {
          return;
        }

        setSnapshot(nextSnapshot);
        setSelectedDispatchOrder(nextSnapshot.dispatchOrders[0]?.id ?? "");
        setMessage("Ready. Choose a dispatch order to trace backward.");

        if (autoResolveValue) {
          const nextSelectedValue = autoResolveValue.trim();

          if (nextSelectedValue) {
            setSelectedDispatchOrder(nextSelectedValue);
            resolveTrace(nextSelectedValue, nextSnapshot);
          }
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

  const lookupOptions = snapshot ? getDispatchOrderLookupOptions(snapshot) : [];

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!snapshot) {
      return;
    }

    resolveTrace(selectedDispatchOrder, snapshot);
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3">
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-zinc-500">Backward trace</p>
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-950">{t("backwardTitle")}</h1>
          <p className="max-w-3xl text-sm leading-6 text-zinc-600">{t("backwardSubtitle")}</p>
        </header>

        <section className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
          <form className="flex flex-col gap-4 md:flex-row md:items-end" onSubmit={handleSubmit}>
            <label className="flex-1 space-y-2">
              <span className="text-sm font-medium text-zinc-800">{t("fieldDispatchOrder")}</span>
              <DemoScanPicker
                options={lookupOptions.map((option) => ({ value: option.id, label: option.label }))}
                onPick={setSelectedDispatchOrder}
              />
              <select
                className="w-full rounded-2xl border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-900 outline-none transition focus:border-zinc-950"
                disabled={loading || lookupOptions.length === 0}
                value={selectedDispatchOrder}
                onChange={(event) => setSelectedDispatchOrder(event.target.value)}
              >
                {lookupOptions.map((option) => (
                  <option key={option.id} value={option.id}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <button
              className="inline-flex h-12 items-center justify-center rounded-2xl bg-zinc-950 px-5 text-sm font-semibold text-white transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:bg-zinc-300"
              disabled={loading || lookupOptions.length === 0}
              type="submit"
            >
              {t("resolveChain")}
            </button>
          </form>

          <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-zinc-600">
            <span>{message}</span>
            {lookupDurationMs !== null ? <Badge tone="muted">{lookupDurationMs.toFixed(1)} ms</Badge> : null}
            <Badge tone="muted">Client-side only</Badge>
            <Badge tone="muted">No network calls</Badge>
          </div>
        </section>

        {!resolution ? (
          <section className="rounded-3xl border border-dashed border-zinc-300 bg-white/70 p-8 text-sm text-zinc-600 shadow-sm">
            {loading ? "Loading seeded IndexedDB data..." : "Pick a dispatch order, then resolve the trace."}
          </section>
        ) : (
          <section className="space-y-6">
            <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">Dispatch order</p>
                  <h2 className="mt-1 text-2xl font-semibold text-zinc-950">
                    {resolution.dispatchOrder ? resolution.dispatchOrder.orderNumber : NOT_RECORDED}
                  </h2>
                  <p className="mt-2 text-sm text-zinc-600">
                    {resolution.dispatchOrder ? resolution.dispatchOrder.id : NOT_RECORDED}
                  </p>
                </div>
                {resolution.dispatchOrder ? <Badge tone="success">Recorded</Badge> : <Badge tone="muted">Not recorded</Badge>}
              </div>

              <dl className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <InfoRow label="Client" value={resolution.dispatchOrder ? resolution.dispatchOrder.clientName : NOT_RECORDED} />
                <InfoRow label="Dispatch date" value={formatDate(resolution.dispatchOrder?.dispatchDate)} />
                <InfoRow label="Quantity" value={valueOrNotRecorded(resolution.dispatchOrder?.quantity)} />
                <InfoRow label="Destination" value={resolution.dispatchOrder ? resolution.dispatchOrder.destination : NOT_RECORDED} />
              </dl>
            </div>

            <div className="space-y-6 border-l-2 border-dashed border-zinc-200 pl-6">
              {resolution.batches.length === 0 ? (
                <div className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm">
                  <p className="text-sm text-zinc-600">No batches were linked to this dispatch order.</p>
                </div>
              ) : (
                resolution.batches.map((batchTrace, index) => {
                  const batch = batchTrace.productionBatch;
                  const batchTitle = batch ? batch.batchNumber : `${batchTrace.batchId} (${NOT_RECORDED})`;
                  const batchSubtitle = batch
                    ? `Operator ${batch.operatorName} on ${formatDateTime(batch.startTime)} to ${formatDateTime(batch.endTime)}`
                    : "The production batch record is missing.";

                  return (
                    <SectionCard
                      key={`${batchTrace.batchId}-${index}`}
                      accent={batch ? "emerald" : "rose"}
                      badge={batchStatus(batchTrace)}
                      eyebrow={`Production batch ${index + 1}`}
                      subtitle={batchSubtitle}
                      title={batchTitle}
                    >
                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                          <dl className="grid gap-4 sm:grid-cols-2">
                            <InfoRow label="Batch ID" value={batch ? batch.id : NOT_RECORDED} />
                            <InfoRow label="Machine" value={batchTrace.machine ? `${batchTrace.machine.name} (${batchTrace.machine.productionLine})` : NOT_RECORDED} />
                            <InfoRow label="Shift" value={batchTrace.shift ? batchTrace.shift.name : NOT_RECORDED} />
                            <InfoRow label="Operator" value={batch ? batch.operatorName : NOT_RECORDED} />
                            <InfoRow label="Start time" value={formatDateTime(batch?.startTime)} />
                            <InfoRow label="End time" value={formatDateTime(batch?.endTime)} />
                            <InfoRow label="Units produced" value={batch ? batch.unitsProduced : NOT_RECORDED} />
                            <InfoRow label="Raw lot count" value={batch ? batch.rawMaterialLotIds.length : NOT_RECORDED} />
                          </dl>
                        </div>

                        <div className="space-y-4">
                          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                Raw material lots
                              </h3>
                              {batch ? <Badge tone="muted">{batch.rawMaterialLotIds.length} linked lot{batch.rawMaterialLotIds.length === 1 ? "" : "s"}</Badge> : <Badge tone="muted">Not recorded</Badge>}
                            </div>

                            <div className="mt-4 space-y-3">
                              {batchTrace.rawMaterialLots.length === 0 ? (
                                <p className="text-sm text-zinc-600">{batch ? NOT_RECORDED : NOT_RECORDED}</p>
                              ) : (
                                batchTrace.rawMaterialLots.map((lotTrace, lotIndex) => {
                                  const lot = lotTrace.rawMaterialLot;

                                  return (
                                    <div key={`${lotTrace.lotId}-${lotIndex}`} className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
                                      <div className="flex flex-wrap items-center justify-between gap-3">
                                        <div>
                                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                            Lot {lotIndex + 1}
                                          </p>
                                          <h4 className="mt-1 text-sm font-semibold text-zinc-950">
                                            {lot ? lot.lotNumber : `${lotTrace.lotId} (${NOT_RECORDED})`}
                                          </h4>
                                        </div>
                                        {lot ? <Badge tone="success">Recorded</Badge> : <Badge tone="muted">Not recorded</Badge>}
                                      </div>

                                      <dl className="mt-3 grid gap-3 sm:grid-cols-2">
                                        <InfoRow label="Material" value={lot ? lot.materialType : NOT_RECORDED} />
                                        <InfoRow label="Received" value={formatDate(lot?.receivedDate)} />
                                        <InfoRow label="Quantity" value={lot ? lot.quantity : NOT_RECORDED} />
                                        <InfoRow
                                          label="Supplier"
                                          value={lotTrace.supplier.supplier ? `${lotTrace.supplier.supplier.name} (${lotTrace.supplier.supplier.id})` : NOT_RECORDED}
                                        />
                                        <InfoRow
                                          label="Supplier contact"
                                          value={lotTrace.supplier.supplier ? lotTrace.supplier.supplier.contactInfo : NOT_RECORDED}
                                        />
                                        <InfoRow
                                          label="Supplier ID"
                                          value={lotTrace.supplier.supplier ? lotTrace.supplier.supplierId || lot?.supplierId || NOT_RECORDED : NOT_RECORDED}
                                        />
                                      </dl>
                                    </div>
                                  );
                                })
                              )}
                            </div>
                          </div>

                          <div className="rounded-2xl border border-zinc-200 bg-white p-4">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                              <h3 className="text-sm font-semibold uppercase tracking-[0.18em] text-zinc-500">
                                QC result
                              </h3>
                              {batchTrace.qcResult ? <Badge tone={resultTone(batchTrace.qcResult.result)}>{batchTrace.qcResult.result}</Badge> : <Badge tone="muted">Not recorded</Badge>}
                            </div>

                            <dl className="mt-4 grid gap-3 sm:grid-cols-2">
                              <InfoRow label="Inspector" value={batchTrace.qcResult ? batchTrace.qcResult.inspectorName : NOT_RECORDED} />
                              <InfoRow label="Inspection date" value={formatDateTime(batchTrace.qcResult?.inspectionDate)} />
                              <InfoRow
                                label="Defects"
                                value={
                                  batchTrace.qcResult
                                    ? batchTrace.qcResult.defects.length > 0
                                      ? batchTrace.qcResult.defects.join("; ")
                                      : "No defects recorded"
                                    : NOT_RECORDED
                                }
                              />
                              <InfoRow
                                label="QC batch ID"
                                value={batchTrace.qcResult ? batchTrace.qcResult.batchId ?? NOT_RECORDED : NOT_RECORDED}
                              />
                            </dl>
                          </div>
                        </div>
                      </div>
                    </SectionCard>
                  );
                })
              )}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}