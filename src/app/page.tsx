"use client";

import Link from "next/link";

import { useAppLocale } from "@/lib/app-ui";

export default function Home() {
  const { t } = useAppLocale();

  return (
    <main className="min-h-screen bg-zinc-50 px-6 py-10 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <header className="space-y-3 text-center">
          <h1 className="text-4xl font-semibold tracking-tight">{t("homeTitle")}</h1>
          <p className="mx-auto max-w-2xl text-base text-zinc-600">{t("homeSubtitle")}</p>
        </header>

        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <Link className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50" href="/entry/raw-material">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("navEntryRawMaterial")}</div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">{t("rawMaterialTitle")}</div>
          </Link>
          <Link className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50" href="/entry/batch">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("navEntryBatch")}</div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">{t("batchTitle")}</div>
          </Link>
          <Link className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50" href="/trace/backward">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("navBackwardTrace")}</div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">{t("backwardTitle")}</div>
          </Link>
          <Link className="rounded-3xl border border-zinc-200 bg-white p-5 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50" href="/dashboard">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-zinc-500">{t("navDashboard")}</div>
            <div className="mt-2 text-lg font-semibold text-zinc-950">{t("dashboardTitle")}</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
