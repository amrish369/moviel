# Play full movies from YouTube in the "For You" section

## What you'll get

- Har movie card par ek naya **Play Full Movie** button.
- Tap karte hi website check karegi ki wo movie YouTube par poori (full-length) available hai ya nahi.
- Mil gayi to wahi website ke andar ek player khulega (YouTube par redirect nahi).
- Nahi mili to saaf message: "Full movie YouTube par nahi mili" — sath me trailer/Telegram option dikhega.

## How it decides a video is the full movie

- Search: `<title> <year> full movie` (plus Hindi/regional variants).
- Sirf wahi results jinki length 70 minute se zyada ho.
- Title me "trailer", "teaser", "song", "review", "reaction", "shorts", "scene", "clip" ho to reject.
- Best match upar, baaki matches "Other versions" list me — agar pehla link theek na chale to dusra chun sakte ho.

## Technical notes

1. New edge function `supabase/functions/movie-full/index.ts`
   - Input: `{ title, year, language }`.
   - YouTube search page scrape (same `ytInitialData` parsing already used in `movie-songs`), multiple query variants.
   - Duration parse (`H:MM:SS`) → filter >= 70 min; keyword blocklist; score by title similarity + views + duration.
   - Output: `{ results: [{ videoId, title, channel, thumbnail, duration, views }] }`, generic error messages (existing convention).
2. New component `src/components/PlayFullMovie.tsx`
   - Button + modal; calls the function on first click, caches per movie.
   - Modal: full-width responsive YouTube iframe (`playsinline`, `rel=0`, fullscreen allowed), title bar, version switcher list, close button.
   - Loading spinner and "not found" state.
3. `src/components/InfiniteFeed.tsx`
   - Add `<PlayFullMovie title={item.title} year={item.year} language={item.language} />` in the action row next to Download / Telegram, with `stopPropagation` so the card navigation doesn't fire.
4. Same button also added to `src/pages/MovieDetail.tsx` action area for consistency.

## Note

Availability YouTube ke public uploads par depend karta hai — kai nayi movies wahan legally nahi hoti, un cards par "not found" state hi dikhega.
