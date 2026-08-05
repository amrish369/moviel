# Study Section — BCA 2nd Semester Playlists

Ek naya `/study` page jisme BCA 2nd semester ki YouTube study playlists subject-wise dikhengi, aur video website ke andar hi modal me play hoga.

## Kya banega

**1. Study page (`/study`)**
- Header me naya "Study" icon (Music icon ke bagal me) + sidebar menu entry.
- Top par do filters:
  - **Semester**: dropdown (abhi sirf "Semester 2" active; baaki placeholder disabled taaki baad me extend ho sake).
  - **Subject**: chips — C Programming, Data Structures, DBMS, Digital Electronics, Mathematics-II, Communication Skills, + "All".
- Optional search box (extra topic type karke playlists refine karna).

**2. Content**
- Chuni gayi subject ke liye YouTube search auto-run hoga (e.g. "BCA 2nd semester Data Structures full course playlist hindi").
- Playlist cards grid me (thumbnail, title, channel, video count) — infinite scroll ke saath, existing feed pattern jaisa.
- Playlist par tap → uske saare videos ki list side/below open hogi.

**3. Playback**
- Video par tap → in-page modal me YouTube embed (trailer modal jaisa), Next/Previous se playlist ke andar aage-peeche.
- Music mini-player ko touch nahi kiya jaayega.

## Technical

- **Backend**: existing `music-feed` edge function ka YouTube scraping logic reuse karke naya `study-feed` function — params: `subject`, `semester`, `q`, `page`, `type=playlists|videos`, `playlistId`. Isse music function me koi change nahi hoga (regression risk zero).
- **Frontend**: `src/pages/Study.tsx`, `src/components/StudyPlaylistCard.tsx`, `src/components/StudyVideoModal.tsx`, hook `src/hooks/useStudyFeed.ts` (infinite scroll, same pattern as `useSectionFeed`).
- **Routing**: `/study` route `App.tsx` me add; `Index.tsx` header + sections menu me link.
- **Subjects config**: `src/data/studySyllabus.ts` me semester → subjects → search-query mapping (aage semesters add karna easy).
- **SEO**: page title/description set + sitemap me `/study` entry.

Koi existing feature, API, ya DB change nahi hoga.
