import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { ADSENSE_CLIENT } from "@/config/ads";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

type Props = {
  slot?: string;
  format?: string;
  layout?: string;
  className?: string;
  /** Minimum reserved height to avoid layout shift (CLS) */
  minHeight?: number;
  label?: boolean;
};

/**
 * Responsive Google AdSense unit.
 * Re-initialises on route change so SPA navigation still fills the slot.
 */
const AdSlot = ({
  slot,
  format = "auto",
  layout,
  className = "",
  minHeight = 100,
  label = true,
}: Props) => {
  const ref = useRef<HTMLModElement>(null);
  const pushed = useRef(false);
  const location = useLocation();

  useEffect(() => {
    pushed.current = false;
  }, [location.pathname]);

  useEffect(() => {
    if (pushed.current) return;
    const t = window.setTimeout(() => {
      try {
        if (ref.current && ref.current.offsetWidth > 0) {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
          pushed.current = true;
        }
      } catch {
        /* ad blocker or script not loaded — ignore silently */
      }
    }, 300);
    return () => window.clearTimeout(t);
  }, [location.pathname]);

  return (
    <div className={`w-full overflow-hidden ${className}`}>
      {label && (
        <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 text-center mb-1">
          Advertisement
        </p>
      )}
      <ins
        ref={ref}
        className="adsbygoogle block"
        style={{ display: "block", minHeight }}
        data-ad-client={ADSENSE_CLIENT}
        data-ad-slot={slot || undefined}
        data-ad-format={format}
        data-ad-layout={layout}
        data-full-width-responsive="true"
      />
    </div>
  );
};

export default AdSlot;
