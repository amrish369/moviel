import { useEffect, useRef } from "react";

// One-player-at-a-time bus: whoever starts playing "claims" media; all others stop.
const EVT = "cr-media-claim";
let counter = 0;
export const newMediaId = (prefix: string) => `${prefix}-${++counter}`;

export const claimMedia = (id: string) => {
  window.dispatchEvent(new CustomEvent(EVT, { detail: id }));
};

export const onMediaClaim = (id: string, stop: () => void) => {
  const h = (e: Event) => { if ((e as CustomEvent).detail !== id) stop(); };
  window.addEventListener(EVT, h);
  return () => window.removeEventListener(EVT, h);
};

/** While `active`, claim media and call `stop` if another player starts. */
export const useMediaClaim = (active: boolean, prefix: string, stop: () => void) => {
  const idRef = useRef<string>("");
  if (!idRef.current) idRef.current = newMediaId(prefix);
  const stopRef = useRef(stop);
  stopRef.current = stop;
  useEffect(() => {
    if (!active) return;
    claimMedia(idRef.current);
    return onMediaClaim(idRef.current, () => stopRef.current());
  }, [active]);
};
