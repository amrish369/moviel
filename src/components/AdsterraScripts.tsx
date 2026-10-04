import { useEffect } from "react";
import { ADSTERRA } from "@/config/ads";

const STORAGE_KEY = "cr_intrusive_ads_last";

/** True when intrusive ads (popunder/social bar) were already shown today. */
const alreadyShownToday = () => {
  try {
    const last = localStorage.getItem(STORAGE_KEY);
    if (!last) return false;
    return new Date(last).toDateString() === new Date().toDateString();
  } catch {
    return false;
  }
};

const markShownToday = () => {
  try {
    localStorage.setItem(STORAGE_KEY, new Date().toISOString());
  } catch {
    /* private mode — ignore */
  }
};

/**
 * Loads Adsterra site-wide formats (social bar + popunder) once per day per user.
 * Prevents repeated popups on every page visit/refresh.
 */
const AdsterraScripts = () => {
  useEffect(() => {
    if (alreadyShownToday()) return;

    const srcs = [ADSTERRA.socialBarSrc, ADSTERRA.popunderSrc].filter(Boolean);
    if (srcs.length === 0) return;

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
    if (added.length > 0) markShownToday();

    return () => {
      added.forEach((s) => s.remove());
    };
  }, []);

  return null;
};

export default AdsterraScripts;
