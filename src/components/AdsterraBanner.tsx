import { useEffect, useRef } from "react";
import { ADSTERRA } from "@/config/ads";

/**
 * Adsterra / PropellerAds native banner.
 * Renders nothing until a script URL is configured in src/config/ads.ts.
 */
const AdsterraBanner = ({ className = "" }: { className?: string }) => {
  const ref = useRef<HTMLDivElement>(null);
  const loaded = useRef(false);

  useEffect(() => {
    if (!ADSTERRA.bannerScriptSrc || loaded.current || !ref.current) return;
    loaded.current = true;
    const s = document.createElement("script");
    s.async = true;
    s.setAttribute("data-cfasync", "false");
    s.src = ADSTERRA.bannerScriptSrc;
    ref.current.appendChild(s);
  }, []);

  if (!ADSTERRA.bannerScriptSrc) return null;

  return (
    <div className={`w-full ${className}`}>
      <p className="text-[9px] uppercase tracking-widest text-muted-foreground/60 text-center mb-1">
        Advertisement
      </p>
      <div ref={ref} />
      {ADSTERRA.bannerContainerId && <div id={ADSTERRA.bannerContainerId} />}
    </div>
  );
};

export default AdsterraBanner;
