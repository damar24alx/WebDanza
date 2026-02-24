"use client";

import { useEffect } from "react";

type WebVitalPayload = {
  name: "CLS" | "LCP" | "FCP" | "TTFB" | "INP";
  value: number;
  rating: "good" | "needs-improvement" | "poor" | "unknown";
  id: string;
  path: string;
  navigationType: string;
};

function rateMetric(name: WebVitalPayload["name"], value: number): WebVitalPayload["rating"] {
  if (name === "CLS") {
    if (value <= 0.1) return "good";
    if (value <= 0.25) return "needs-improvement";
    return "poor";
  }
  if (name === "LCP") {
    if (value <= 2500) return "good";
    if (value <= 4000) return "needs-improvement";
    return "poor";
  }
  if (name === "FCP") {
    if (value <= 1800) return "good";
    if (value <= 3000) return "needs-improvement";
    return "poor";
  }
  if (name === "TTFB") {
    if (value <= 800) return "good";
    if (value <= 1800) return "needs-improvement";
    return "poor";
  }

  return "unknown";
}

function sendMetric(payload: WebVitalPayload) {
  const body = JSON.stringify(payload);
  if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
    const blob = new Blob([body], { type: "application/json" });
    navigator.sendBeacon("/api/observability/web-vitals", blob);
    return;
  }

  fetch("/api/observability/web-vitals", {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    keepalive: true,
    body,
  }).catch(() => {
    // Silent fail: observability should never break UX.
  });
}

export function WebVitalsReporter() {
  useEffect(() => {
    if (typeof window === "undefined" || typeof PerformanceObserver === "undefined") {
      return;
    }

    const sentIds = new Set<string>();
    const path = `${window.location.pathname}${window.location.search}`;
    const navigationType =
      performance.getEntriesByType("navigation")[0] &&
      "type" in performance.getEntriesByType("navigation")[0]
        ? String(
            (performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming).type,
          )
        : "unknown";

    const emit = (name: WebVitalPayload["name"], value: number, id: string) => {
      const safeValue = Number.isFinite(value) ? value : 0;
      const cacheKey = `${name}:${id}`;
      if (sentIds.has(cacheKey)) {
        return;
      }
      sentIds.add(cacheKey);

      sendMetric({
        name,
        value: safeValue,
        rating: rateMetric(name, safeValue),
        id,
        path,
        navigationType,
      });
    };

    const navigationEntry = performance.getEntriesByType("navigation")[0] as
      | PerformanceNavigationTiming
      | undefined;
    if (navigationEntry) {
      emit("TTFB", navigationEntry.responseStart, `${navigationEntry.name || "document"}:ttfb`);
    }

    const paintObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        if (entry.name === "first-contentful-paint") {
          emit("FCP", entry.startTime, `${entry.name}:${entry.startTime}`);
        }
      }
    });
    paintObserver.observe({ type: "paint", buffered: true });

    let lastLcpEntry: PerformanceEntry | null = null;
    const lcpObserver = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      if (entries.length > 0) {
        lastLcpEntry = entries[entries.length - 1] ?? null;
      }
    });
    lcpObserver.observe({ type: "largest-contentful-paint", buffered: true });

    let clsValue = 0;
    const clsObserver = new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as Array<PerformanceEntry & { value?: number; hadRecentInput?: boolean }>) {
        if (!entry.hadRecentInput) {
          clsValue += entry.value ?? 0;
        }
      }
    });
    clsObserver.observe({ type: "layout-shift", buffered: true });

    const flushMetrics = () => {
      if (lastLcpEntry) {
        emit("LCP", lastLcpEntry.startTime, `lcp:${Math.round(lastLcpEntry.startTime)}`);
      }
      emit("CLS", clsValue, "cls:final");
    };

    const handleVisibilityChange = () => {
      if (document.visibilityState === "hidden") {
        flushMetrics();
      }
    };

    window.addEventListener("pagehide", flushMetrics);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      flushMetrics();
      window.removeEventListener("pagehide", flushMetrics);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      paintObserver.disconnect();
      lcpObserver.disconnect();
      clsObserver.disconnect();
    };
  }, []);

  return null;
}

