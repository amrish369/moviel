import { useEffect } from "react";
import { ADSTERRA } from "@/config/ads";

/** Loads Adsterra site-wide formats (social bar + popunder) once. */
const AdsterraScripts = () => {
  useEffect(() => {
    const srcs = [ADSTERRA.socialBarSrc, ADSTERRA.popunderSrc].filter(Boolean);
    const added: HTMLScriptElement[] = [];
    for (const src of srcs) {
      if (document.querySelector(`script[src="${src}"]`)) continue;
      const s = document.createElement("script");
      s.src = src;
      s.async = true;
      s.setAttribute("data-cfasync", "false");
      document.body.appendChild(s);
      added.push(s);
    }
    return () => {
      added.forEach((s) => s.remove());
    };
  }, []);

  return null;
};

export default AdsterraScripts;
