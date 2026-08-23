# Study Hub — Subject-wise strict filtering (IGNOU BCA Sem 2)

Abhi Study page ke subjects generic BCA naam hain aur search query loose hai, isliye kisi bhi subject par click karne par mila-jula content aata hai. Ise tumhare actual 6 subjects par strict kar denge.

## Subjects (Semester 2)

- FEG-02 — Foundation Course in English-2
- MCS-201 — Programming in C and Python
- MCS-202 — Computer Organisation
- MCS-203 — Operating Systems
- MCSL-204 — Windows and Linux Lab
- MCSL-205 — C and Python Lab

## Kya badlega

**1. Subject chips**
- Purane generic subjects (Data Structures, DBMS, Maths-II...) hata kar upar wale 6 codes + naam wale chips.
- Chip par code (e.g. MCS-201) bold, neeche full subject name.

**2. Strict per-subject content**
- Har subject ke liye ek query set (code + full name + core topics), e.g. MCS-201 → "MCS 201 IGNOU", "programming in C and Python IGNOU", "C programming full course hindi", "python full course hindi".
- Result par relevance filter: title/channel me subject ke keywords match honge tabhi card dikhega. Non-matching (random BCA/other-sem/entertainment) content drop.
- Lab subjects (MCSL-204/205) ke liye practical-oriented queries (Linux commands, lab practical, C/Python programs solution).

**3. Playlists + Videos dono**
- Page par "Playlists" / "Videos" toggle — abhi sirf playlists dikhti hain. Dono me same subject filter lagega.

**4. Infinite scroll & search**
- Same infinite scroll rahega; query variants rotate honge taaki naya content aata rahe.
- Search box subject filter ke saath combine hoga (subject ke andar topic search).

## Technical

- `src/data/studySyllabus.ts`: Semester 2 subjects replace — har subject me `code`, `label`, `queries: string[]`, `keywords: string[]`.
- `supabase/functions/study-feed/index.ts`: naye params `subjectQueries` / `keywords` (ya `subjectId` server-side map) accept karke query rotation + title-based relevance scoring; threshold se neeche items filter out. Playlist/video dono paths par lagega.
- `src/hooks/useStudyFeed.ts`: subject ke queries/keywords bhejna, empty-after-filter par next page auto-retry (already hai) barkarar.
- `src/pages/Study.tsx`: naye chips (code + name), Playlists/Videos toggle, empty-state text update.
- SEO: page title/description IGNOU BCA Sem 2 subjects ke naam ke saath update.

Music, movies, ya baaki koi feature touch nahi hoga.
