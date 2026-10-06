"use client";

import { useEffect } from "react";

import { seedDemoData } from "@/lib/traceability-db";

export default function DatabaseSeeder() {
  useEffect(() => {
    void seedDemoData();
  }, []);

  return null;
}