"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAppLocale } from "@/lib/app-ui";

const navItems = [
  { href: "/", label: "navHome" },
  { href: "/debug", label: "navDebug" },
  { href: "/trace/backward", label: "navBackwardTrace" },
  { href: "/trace/forward", label: "navForwardTrace" },
  { href: "/dashboard", label: "navDashboard" },
  { href: "/entry/raw-material", label: "navEntryRawMaterial" },
  { href: "/entry/batch", label: "navEntryBatch" },
  { href: "/entry/qc", label: "navEntryQc" },
  { href: "/entry/dispatch", label: "navEntryDispatch" },
] as const;

function isActiveRoute(pathname: string, href: string) {
  if (href === "/") {
    return pathname === "/";
  }

  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function SiteNav() {
  const pathname = usePathname();
  const { language, toggleLanguage, t } = useAppLocale();

  return (
    <nav className="flex flex-wrap items-center gap-2 text-sm font-medium text-zinc-600">
      {navItems.map((item) => {
        const active = isActiveRoute(pathname, item.href);

        return (
          <Link
            key={item.href}
            aria-current={active ? "page" : undefined}
            className={[
              "rounded-full px-3 py-2 transition",
              active
                ? "bg-zinc-950 text-white shadow-sm"
                : "hover:bg-zinc-100 hover:text-zinc-950",
            ].join(" ")}
            href={item.href}
          >
            {t(item.label)}
          </Link>
        );
      })}
      <button
        aria-label={t("toggleLanguage")}
        className="rounded-full border border-zinc-300 px-3 py-2 text-xs font-semibold uppercase tracking-[0.2em] text-zinc-700 transition hover:bg-zinc-100 hover:text-zinc-950"
        type="button"
        onClick={toggleLanguage}
      >
        {language === "en" ? "EN" : "MR"}
      </button>
    </nav>
  );
}