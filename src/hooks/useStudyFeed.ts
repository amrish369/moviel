import { useCallback, useEffect, useRef, useState } from "react";

export interface StudyPlaylist {
  playlistId: string;
  title: string;
  channel: string;
  thumbnail: string;
  videoCount: string;
}

export interface StudyVideo {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration: string;
  views: string;
}

const FN_URL = `https://${import.meta.env.VITE_SUPABASE_PROJECT_ID}.supabase.co/functions/v1/study-feed`;

export const fetchPlaylistVideos = async (playlistId: string): Promise<StudyVideo[]> => {
  const res = await fetch(`${FN_URL}?playlistId=${encodeURIComponent(playlistId)}`);
  const json = await res.json();
  return json.videos ?? [];
};

interface Params {
  semester: string;
  subject: string;
  query: string;
  type: "playlists" | "videos";
}

export const useStudyFeed = ({ semester, subject, query, type }: Params) => {
  const [playlists, setPlaylists] = useState<StudyPlaylist[]>([]);
  const [videos, setVideos] = useState<StudyVideo[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const pageRef = useRef(1);
  const seenRef = useRef(new Set<string>());
  const loadingRef = useRef(false);

  const load = useCallback(async () => {
    if (loadingRef.current) return;
    loadingRef.current = true;
    setIsLoading(true);
    setError(null);
    try {
      let attempts = 0;
      let added = 0;
      while (attempts < 4 && added === 0) {
        const params = new URLSearchParams({
          semester,
          subject,
          type,
          page: String(pageRef.current),
        });
        if (query.trim()) params.set("q", query.trim());
        const res = await fetch(`${FN_URL}?${params}`);
        const json = await res.json();
        pageRef.current += 1;
        attempts += 1;

        if (type === "playlists") {
          const incoming: StudyPlaylist[] = json.playlists ?? [];
          const fresh = incoming.filter((p) => p.playlistId && !seenRef.current.has(p.playlistId));
          fresh.forEach((p) => seenRef.current.add(p.playlistId));
          added = fresh.length;
          if (fresh.length) setPlaylists((prev) => [...prev, ...fresh]);
        } else {
          const incoming: StudyVideo[] = json.videos ?? [];
          const fresh = incoming.filter((v) => v.videoId && !seenRef.current.has(v.videoId));
          fresh.forEach((v) => seenRef.current.add(v.videoId));
          added = fresh.length;
          if (fresh.length) setVideos((prev) => [...prev, ...fresh]);
        }
      }
      if (added === 0 && pageRef.current > 6) setHasMore(false);
    } catch {
      setError("Content load nahi ho paaya. Dobara try karein.");
    } finally {
      loadingRef.current = false;
      setIsLoading(false);
    }
  }, [semester, subject, query, type]);

  // reset when filters change
  useEffect(() => {
    pageRef.current = 1;
    seenRef.current = new Set();
    setPlaylists([]);
    setVideos([]);
    setHasMore(true);
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [semester, subject, query, type]);

  return { playlists, videos, isLoading, hasMore, error, loadMore: load };
};
