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

type PageMeta = {
  title: string;
  description: string;
  url?: string;
};

/**
 * Sets page title, description, canonical and Open Graph/Twitter tags while
 * the component is mounted, restoring the previous head state on unmount.
 */
export function usePageMeta({ title, description, url }: PageMeta) {
  useEffect(() => {
    const prevTitle = document.title;
    document.title = title;

    const created: HTMLElement[] = [];
    const restore: Array<() => void> = [];

    const setTag = (selector: string, make: () => HTMLElement, attr: string, value: string) => {
      const existing = document.head.querySelector(selector) as HTMLElement | null;
      if (existing) {
        const prev = existing.getAttribute(attr);
        existing.setAttribute(attr, value);
        restore.push(() => {
          if (prev === null) existing.removeAttribute(attr);
          else existing.setAttribute(attr, prev);
        });
      } else {
        const el = make();
        el.setAttribute(attr, value);
        el.setAttribute("data-seo-managed", "page");
        document.head.appendChild(el);
        created.push(el);
      }
    };

    const meta = (name: string, value: string) =>
      setTag(`meta[name="${name}"]`, () => {
        const el = document.createElement("meta");
        el.setAttribute("name", name);
        return el;
      }, "content", value);

    const og = (property: string, value: string) =>
      setTag(`meta[property="${property}"]`, () => {
        const el = document.createElement("meta");
        el.setAttribute("property", property);
        return el;
      }, "content", value);

    meta("description", description);
    og("og:title", title);
    og("og:description", description);
    og("og:type", "website");
    meta("twitter:title", title);
    meta("twitter:description", description);

    if (url) {
      og("og:url", url);
      setTag('link[rel="canonical"]', () => {
        const el = document.createElement("link");
        el.setAttribute("rel", "canonical");
        return el;
      }, "href", url);
    }

    return () => {
      document.title = prevTitle;
      restore.forEach((fn) => fn());
      created.forEach((el) => el.remove());
    };
  }, [title, description, url]);
}
