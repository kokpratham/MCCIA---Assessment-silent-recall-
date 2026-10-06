"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import DatabaseSeeder from "@/components/database-seeder";
import OfflineSyncBadge from "@/components/offline-sync-badge";
import SiteNav from "@/components/site-nav";
import { AppLocaleProvider, useAppLocale } from "@/lib/app-ui";

function ShellHeader() {
  const { t } = useAppLocale();

  return (
    <header className="sticky top-0 z-50 border-b border-zinc-200 bg-white/95 backdrop-blur">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-3 px-6 py-4 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center justify-between gap-4">
          <Link href="/" className="text-sm font-semibold tracking-tight text-zinc-950">
            {t("appName")}
          </Link>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <SiteNav />
          <OfflineSyncBadge />
        </div>
      </div>
    </header>
  );
}

export default function AppShell({ children }: { children: ReactNode }) {
  return (
    <AppLocaleProvider>
      <DatabaseSeeder />
      <div className="flex min-h-screen flex-col bg-zinc-50 text-zinc-900">
        <ShellHeader />
        <div className="flex-1">{children}</div>
      </div>
    </AppLocaleProvider>
  );
}