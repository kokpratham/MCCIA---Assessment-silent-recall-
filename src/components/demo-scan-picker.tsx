"use client";

import { useState } from "react";

import { useAppLocale } from "@/lib/app-ui";

export interface DemoScanOption {
  value: string;
  label: string;
}

export default function DemoScanPicker(props: {
  options: DemoScanOption[];
  onPick: (value: string) => void;
}) {
  const { options, onPick } = props;
  const { t } = useAppLocale();
  const [open, setOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState("");

  return (
    <div className="relative">
      <button
        className="rounded-2xl border border-zinc-300 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
        type="button"
        onClick={() => {
          if (!open && !selectedValue && options.length > 0) {
            setSelectedValue(options[0].value);
          }
          setOpen((current) => !current);
        }}
      >
        {t("scanQrDemo")}
      </button>

      {open ? (
        <div className="absolute left-0 top-11 z-20 w-80 rounded-2xl border border-zinc-200 bg-white p-3 shadow-lg">
          <label className="space-y-2 text-sm">
            <span className="font-medium text-zinc-800">{t("chooseExistingId")}</span>
            <select
              className="w-full rounded-xl border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
              value={selectedValue}
              onChange={(event) => setSelectedValue(event.target.value)}
            >
              {options.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>

          <div className="mt-3 flex items-center justify-end gap-2">
            <button
              className="rounded-xl border border-zinc-300 px-3 py-2 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
              type="button"
              onClick={() => setOpen(false)}
            >
              {t("close")}
            </button>
            <button
              className="rounded-xl bg-zinc-950 px-3 py-2 text-xs font-semibold text-white transition hover:bg-zinc-800"
              type="button"
              onClick={() => {
                if (selectedValue) {
                  onPick(selectedValue);
                }
                setOpen(false);
              }}
            >
              {t("applyScan")}
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}