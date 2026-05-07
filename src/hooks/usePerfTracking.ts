import { useEffect } from "react";

// Lightweight Core Web Vitals tracker — logs LCP, CLS, INP-ish (FID), TTFB.
// No external deps. Safe in production; fails silently on unsupported browsers.
export function usePerfTracking(label: string) {
  useEffect(() => {
    if (typeof window === "undefined" || !("PerformanceObserver" in window)) return;
    const log = (name: string, value: number, extra?: Record<string, unknown>) => {
      try {
        // eslint-disable-next-line no-console
        console.info(`[perf:${label}] ${name}=${Math.round(value)}ms`, extra || "");
        // Optional: forward to analytics if defined globally
        (window as any).dataLayer?.push?.({ event: "web_vital", metric: name, value, page: label });
      } catch {}
    };

    const obs: PerformanceObserver[] = [];
    try {
      const lcpObs = new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const last = entries[entries.length - 1] as any;
        if (last) log("LCP", last.renderTime || last.loadTime || last.startTime);
      });
      lcpObs.observe({ type: "largest-contentful-paint", buffered: true } as any);
      obs.push(lcpObs);
    } catch {}

    let cls = 0;
    try {
      const clsObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries() as any[]) {
          if (!e.hadRecentInput) cls += e.value;
        }
      });
      clsObs.observe({ type: "layout-shift", buffered: true } as any);
      obs.push(clsObs);
    } catch {}

    try {
      const fidObs = new PerformanceObserver((list) => {
        for (const e of list.getEntries() as any[]) {
          log("FID", e.processingStart - e.startTime);
        }
      });
      fidObs.observe({ type: "first-input", buffered: true } as any);
      obs.push(fidObs);
    } catch {}

    try {
      const nav = performance.getEntriesByType("navigation")[0] as PerformanceNavigationTiming | undefined;
      if (nav) log("TTFB", nav.responseStart);
    } catch {}

    const onHide = () => log("CLS", cls * 1000); // ms-equivalent for log
    document.addEventListener("visibilitychange", onHide, { once: true });

    return () => {
      obs.forEach((o) => o.disconnect());
      document.removeEventListener("visibilitychange", onHide);
    };
  }, [label]);
}