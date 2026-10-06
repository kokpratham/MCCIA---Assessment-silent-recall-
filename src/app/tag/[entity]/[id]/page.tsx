"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";

import { useAppLocale } from "@/lib/app-ui";
import { loadTraceabilitySnapshot, seedDemoData } from "@/lib/traceability-db";

type TagEntity = "raw-material" | "batch" | "qc" | "dispatch";

function entityLabel(entity: TagEntity, t: (key: never) => string) {
  switch (entity) {
    case "raw-material":
      return t("rawMaterialTitle" as never);
    case "batch":
      return t("batchTitle" as never);
    case "qc":
      return t("qcTitle" as never);
    case "dispatch":
      return t("dispatchTitle" as never);
  }
}

function QrPreview({ value }: { value: string }) {
  return <QRCodeSVG aria-label="QR code" role="img" value={value} size={240} level="M" includeMargin />;
}

export default function PrintableTagPage({ params }: { params: Promise<{ entity: TagEntity; id: string }> }) {
  const { t } = useAppLocale();
  const { entity, id } = use(params);
  const [summary, setSummary] = useState<string>("");

  useEffect(() => {
    let active = true;

    async function loadData() {
      await seedDemoData();
      const snapshot = await loadTraceabilitySnapshot();
      let nextSummary = id;

      switch (entity) {
        case "raw-material": {
          const record = snapshot.rawMaterialLots.find((lot) => lot.id === id);
          nextSummary = record ? `${record.lotNumber} · ${record.materialType}` : id;
          break;
        }
        case "batch": {
          const record = snapshot.productionBatches.find((batch) => batch.id === id);
          nextSummary = record ? `${record.batchNumber} · ${record.operatorName}` : id;
          break;
        }
        case "qc": {
          const record = snapshot.qcResults.find((qcResult) => qcResult.id === id);
          nextSummary = record ? `${record.result} · ${record.inspectorName}` : id;
          break;
        }
        case "dispatch": {
          const record = snapshot.dispatchOrders.find((dispatchOrder) => dispatchOrder.id === id);
          nextSummary = record ? `${record.orderNumber} · ${record.clientName}` : id;
          break;
        }
      }

      if (active) {
        setSummary(nextSummary);
      }
    }

    void loadData();

    return () => {
      active = false;
    };
  }, [entity, id]);

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900 print:bg-white">
      <div className="mx-auto flex w-full max-w-xl flex-col items-center gap-6 rounded-3xl border border-zinc-200 bg-white p-8 shadow-sm print:border-0 print:shadow-none">
        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-zinc-500">{t("printableTag")}</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">{entityLabel(entity, t as never)}</h1>
          <p className="mt-2 text-sm text-zinc-600">{t("tagSubtitle")}</p>
        </div>

        <div className="rounded-3xl border border-zinc-200 bg-zinc-50 p-5">
          <QrPreview value={id} />
        </div>

        <div className="text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("fieldId")}</p>
          <p className="mt-1 break-all text-lg font-semibold text-zinc-950">{id}</p>
          <p className="mt-1 text-sm text-zinc-600">{summary}</p>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 print:hidden">
          <button
            className="rounded-2xl bg-zinc-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-zinc-800"
            type="button"
            onClick={() => window.print()}
          >
            {t("printTag")}
          </button>
          <Link className="rounded-2xl border border-zinc-300 px-5 py-3 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-100" href="/debug">
            {t("navDebug")}
          </Link>
        </div>
      </div>
    </main>
  );
}