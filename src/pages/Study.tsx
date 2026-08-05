import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, GraduationCap, Loader2, Search, X } from "lucide-react";
import StudyPlaylistCard from "@/components/StudyPlaylistCard";
import StudyVideoModal from "@/components/StudyVideoModal";
import { SEMESTERS, getSemester } from "@/data/studySyllabus";
import { fetchPlaylistVideos, useStudyFeed, type StudyVideo } from "@/hooks/useStudyFeed";

const Study = () => {
  const [semester, setSemester] = useState("2");
  const [subjectId, setSubjectId] = useState("all");
  const [searchInput, setSearchInput] = useState("");
  const [query, setQuery] = useState("");

  const sem = getSemester(semester);
  const subject = subjectId === "all" ? "" : (sem.subjects.find((s) => s.id === subjectId)?.query ?? "");

  const { playlists, isLoading, hasMore, error, loadMore } = useStudyFeed({
    semester,
    subject,
    query,
    type: "playlists",
  });

  const [modalVideos, setModalVideos] = useState<StudyVideo[] | null>(null);
  const [modalIndex, setModalIndex] = useState(0);
  const [openingId, setOpeningId] = useState<string | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    document.title = "BCA 2nd Semester Study Playlists — Free Video Lectures | CineRadar";
    let desc = document.querySelector('meta[name="description"]');
    if (!desc) {
      desc = document.createElement("meta");
      desc.setAttribute("name", "description");
      document.head.appendChild(desc);
    }
    desc.setAttribute(
      "content",
      "BCA 2nd semester ke saare subjects ki free YouTube study playlists — C Programming, Data Structures, DBMS, Digital Electronics aur zyada. Website par hi play karein.",
    );
  }, []);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const io = new IntersectionObserver((entries) => {
      if (entries[0].isIntersecting && !isLoading && hasMore) loadMore();
    }, { rootMargin: "600px" });
    io.observe(el);
    return () => io.disconnect();
  }, [isLoading, hasMore, loadMore]);

  const openPlaylist = async (playlistId: string) => {
    setOpeningId(playlistId);
    const videos = await fetchPlaylistVideos(playlistId);
    setOpeningId(null);
    if (videos.length) {
      setModalVideos(videos);
      setModalIndex(0);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border sticky top-0 z-50 bg-background/80 backdrop-blur-xl">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link to="/" aria-label="Back to home" className="w-9 h-9 rounded-lg bg-secondary/60 hover:bg-secondary flex items-center justify-center">
            <ArrowLeft className="w-4 h-4 text-foreground" />
          </Link>
          <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center glow-gold">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h1 className="font-display text-lg font-bold text-gradient-gold leading-tight">Study Hub</h1>
            <p className="text-[10px] text-muted-foreground">BCA video lectures & playlists</p>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-6 space-y-6">
        {/* Filters */}
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <label className="text-xs text-muted-foreground" htmlFor="semester-select">Semester</label>
            <select
              id="semester-select"
              value={semester}
              onChange={(e) => { setSemester(e.target.value); setSubjectId("all"); }}
              className="bg-secondary/70 border border-border rounded-lg px-3 py-1.5 text-sm text-foreground"
            >
              {SEMESTERS.map((s) => (
                <option key={s.id} value={s.id} disabled={!s.available}>
                  {s.label}{s.available ? "" : " (coming soon)"}
                </option>
              ))}
            </select>
          </div>

          <div className="flex flex-wrap gap-2">
            {[{ id: "all", label: "All Subjects" }, ...sem.subjects].map((s) => (
              <button
                key={s.id}
                onClick={() => setSubjectId(s.id)}
                className={`text-xs px-3 py-1.5 rounded-full border transition-colors ${
                  subjectId === s.id
                    ? "bg-primary/15 text-primary border-primary/40 font-semibold"
                    : "bg-secondary/60 text-foreground border-border hover:border-primary/30"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          <form
            onSubmit={(e) => { e.preventDefault(); setQuery(searchInput); }}
            className="relative"
          >
            <Search className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Topic search karein (e.g. pointers in C, SQL joins)"
              className="w-full bg-secondary/60 border border-border rounded-lg pl-9 pr-9 py-2 text-sm text-foreground placeholder:text-muted-foreground"
            />
            {(searchInput || query) && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => { setSearchInput(""); setQuery(""); }}
                className="absolute right-3 top-1/2 -translate-y-1/2"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </form>
        </div>

        {error && (
          <div className="bg-cinema-red/10 border border-cinema-red/30 rounded-lg p-3 text-sm text-cinema-red">⚠️ {error}</div>
        )}

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {playlists.map((p) => (
            <div key={p.playlistId} className="relative">
              <StudyPlaylistCard playlist={p} onClick={() => openPlaylist(p.playlistId)} />
              {openingId === p.playlistId && (
                <div className="absolute inset-0 rounded-lg bg-background/70 flex items-center justify-center">
                  <Loader2 className="w-5 h-5 text-primary animate-spin" />
                </div>
              )}
            </div>
          ))}
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 text-primary animate-spin" /> Playlists load ho rahi hain...
          </div>
        )}

        {!isLoading && playlists.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">Koi playlist nahi mili. Doosra subject ya keyword try karein.</p>
        )}

        <div ref={sentinelRef} className="h-10" />
      </main>

      {modalVideos && (
        <StudyVideoModal
          videos={modalVideos}
          index={modalIndex}
          onIndexChange={setModalIndex}
          onClose={() => setModalVideos(null)}
        />
      )}
    </div>
  );
};

export default Study;
