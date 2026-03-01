"use client";
import { useEffect, useRef } from "react";
import type { BugKitReporterProps, BugKitInstance } from "./types";

declare global {
  interface Window {
    BugKit?: {
      init: (config: Omit<BugKitReporterProps, "onReportSubmit"> & { onSubmit?: (id: string) => void }) => BugKitInstance;
    };
  }
}

export function BugKitReporter({
  projectId,
  apiKey,
  user,
  position = "bottom-right",
  theme = "auto",
  onReportSubmit,
}: BugKitReporterProps) {
  const instanceRef = useRef<BugKitInstance | null>(null);

  useEffect(() => {
    // Load widget script if not already loaded
    const scriptId = "bugkit-widget-script";
    if (!document.getElementById(scriptId)) {
      const script = document.createElement("script");
      script.id = scriptId;
      script.src = "https://cdn.bugkit.threestack.io/widget.js";
      script.async = true;
      script.onload = () => {
        initWidget();
      };
      document.head.appendChild(script);
    } else if (window.BugKit) {
      initWidget();
    }

    function initWidget() {
      if (!window.BugKit) return;
      instanceRef.current = window.BugKit.init({
        projectId,
        apiKey,
        user,
        position,
        theme,
        onSubmit: onReportSubmit,
      });
    }

    return () => {
      instanceRef.current?.destroy();
    };
  }, [projectId, apiKey]);

  return null;
}
