import { useEffect } from "react";

/**
 * Adds a <meta name="robots" content="noindex, follow"> tag while the
 * component is mounted, and removes it on unmount. Used for private or
 * utility routes (auth, dashboard, watchlist, 404) that must not appear
 * in search results but should still let crawlers follow outbound links.
 */
export function useNoIndex(title?: string) {
  useEffect(() => {
    const meta = document.createElement("meta");
    meta.setAttribute("name", "robots");
    meta.setAttribute("content", "noindex, follow");
    meta.setAttribute("data-seo-managed", "noindex");
    document.head.appendChild(meta);

    const prevTitle = document.title;
    if (title) document.title = title;

    return () => {
      meta.remove();
      if (title) document.title = prevTitle;
    };
  }, [title]);
}
