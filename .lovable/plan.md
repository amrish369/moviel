# Verify page: proper titles, richer content, and a way into the main site

Goal: make `/verify` feel like a real CineRadar page — correct browser/social titles, more helpful text, an explanation of what CineRadar is, and clear links back into the main website — while keeping the existing 3-step unlock flow untouched.

## What changes on the page

1. **Head tags for the verify page**
   - Title: "Verify & Unlock Your Movie File | CineRadar"
   - Meta description explaining the 3-step unlock (open sponsor, wait, confirm, then return to the bot).
   - Open Graph + Twitter tags (title, description, type, url `https://moviel.lovable.app/verify`) plus a self-referencing canonical, all set on mount and cleaned up on unmount so other pages are unaffected.
   - Because the site is a single static page app, these tags are visible to Google but not to social preview crawlers; the sitewide image/title in `index.html` stays as the fallback.

2. **More content on the page**
   - A short "Why this step?" block: the sponsor visit keeps the bot free, no payment, no signup, takes about 20 seconds.
   - A "What is CineRadar?" block: daily Bollywood / South / OTT releases, trailer reels, reviews, box office, music and study sections — 3–4 bullets, short lines.
   - A small FAQ (3 questions): why verify, how long it lasts, what to do if the link expired.
   - A trust line: no files hosted here, data from TMDB, links to Privacy / Disclaimer / Contact.

3. **Entry into the main website**
   - A prominent "Explore CineRadar" button linking to `/`.
   - A row of quick links: Home, Trailer Reels, Web Series, Music, Study.
   - These appear both above the fold (small text link) and after step 3 (big button), so a user who came only for the file has an obvious way in.
   - Sponsor page opening stays exactly as-is; the return-to-bot button remains the primary action after verification.

4. **Shareable sponsor step**
   - Add a "Copy link" / native share button next to the sponsor step so users can pass the verify link on, which raises repeat traffic through the same flow.

## Technical notes

- All work is in `src/pages/Verify.tsx` plus a small reusable head helper alongside `src/lib/seo.ts` (a `usePageMeta` hook that sets title/description/canonical/og tags and restores them on unmount).
- No backend, no changes to the `unlock` edge function, tokens, or the step logic.
- Existing ad placements (`AdSlot`, `AdsterraIframe`, `AdsterraBanner`) stay where they are; new content is placed between them, keeping ads separated by real content as AdSense expects.
- `/verify` stays indexable (no `useNoIndex`), since it now has genuine content.

## Note

Head changes only reach the live URL after the next publish.
