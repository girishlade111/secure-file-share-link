"use client";

import { useEffect } from "react";
import { startCleanupScheduler, stopCleanupScheduler } from "@/lib/cleanup";

export default function CleanupScheduler() {
  useEffect(() => {
    startCleanupScheduler();

    return () => {
      stopCleanupScheduler();
    };
  }, []);

  return null;
}