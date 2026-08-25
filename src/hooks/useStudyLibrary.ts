import { useCallback, useEffect, useState } from "react";

export interface StudyProgressEntry {
  videoId: string;
  subjectId: string;
  title: string;
  channel: string;
  thumbnail: string;
  seconds: number;
  duration: number;
  completed: boolean;
  updatedAt: number;
}

export interface StudyBookmark {
  videoId: string;
  subjectId: string;
  title: string;
  channel: string;
  thumbnail: string;
  duration?: string;
  createdAt: number;
}

export interface StudyQuizResult {
  videoId: string;
  subjectId: string;
  title: string;
  score: number;
  total: number;
  weakTopics: string[];
  at: number;
}

const PROGRESS_KEY = "cineradar:study:progress";
const BOOKMARK_KEY = "cineradar:study:bookmarks";
const QUIZ_KEY = "cineradar:study:quiz";
const COMPLETE_RATIO = 0.9;

type ProgressMap = Record<string, StudyProgressEntry>;
type BookmarkMap = Record<string, StudyBookmark>;
type QuizMap = Record<string, StudyQuizResult>;

function read<T>(key: string): T {
  try {
    return JSON.parse(localStorage.getItem(key) || "{}") as T;
  } catch {
    return {} as T;
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {}
}

const EVT = "cineradar:study:change";
const emit = () => window.dispatchEvent(new Event(EVT));

export function useStudyLibrary() {
  const [progress, setProgress] = useState<ProgressMap>(() => read<ProgressMap>(PROGRESS_KEY));
  const [bookmarks, setBookmarks] = useState<BookmarkMap>(() => read<BookmarkMap>(BOOKMARK_KEY));

  useEffect(() => {
    const sync = () => {
      setProgress(read<ProgressMap>(PROGRESS_KEY));
      setBookmarks(read<BookmarkMap>(BOOKMARK_KEY));
    };
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  const saveProgress = useCallback(
    (entry: Omit<StudyProgressEntry, "updatedAt" | "completed"> & { completed?: boolean }) => {
      const map = read<ProgressMap>(PROGRESS_KEY);
      const prev = map[entry.videoId];
      const completed =
        entry.completed ??
        (prev?.completed ||
          (entry.duration > 0 && entry.seconds / entry.duration >= COMPLETE_RATIO));
      map[entry.videoId] = { ...entry, completed, updatedAt: Date.now() };
      write(PROGRESS_KEY, map);
      setProgress(map);
      emit();
    },
    [],
  );

  const setCompleted = useCallback((videoId: string, completed: boolean) => {
    const map = read<ProgressMap>(PROGRESS_KEY);
    const prev = map[videoId];
    if (!prev) return;
    map[videoId] = { ...prev, completed, seconds: completed ? prev.seconds : 0, updatedAt: Date.now() };
    write(PROGRESS_KEY, map);
    setProgress(map);
    emit();
  }, []);

  const resumeAt = useCallback((videoId: string) => {
    const e = read<ProgressMap>(PROGRESS_KEY)[videoId];
    if (!e || e.completed) return 0;
    return e.seconds > 10 && (!e.duration || e.seconds < e.duration - 15) ? Math.floor(e.seconds) : 0;
  }, []);

  const toggleBookmark = useCallback((b: Omit<StudyBookmark, "createdAt">) => {
    const map = read<BookmarkMap>(BOOKMARK_KEY);
    if (map[b.videoId]) delete map[b.videoId];
    else map[b.videoId] = { ...b, createdAt: Date.now() };
    write(BOOKMARK_KEY, map);
    setBookmarks(map);
    emit();
    return Boolean(map[b.videoId]);
  }, []);

  const statsFor = useCallback(
    (subjectId: string) => {
      const list = Object.values(progress).filter((p) => !subjectId || subjectId === "all" || p.subjectId === subjectId);
      const completed = list.filter((p) => p.completed).length;
      const started = list.length;
      return {
        started,
        completed,
        inProgress: started - completed,
        percent: started ? Math.round((completed / started) * 100) : 0,
      };
    },
    [progress],
  );

  const bookmarksFor = useCallback(
    (subjectId: string) =>
      Object.values(bookmarks)
        .filter((b) => !subjectId || subjectId === "all" || b.subjectId === subjectId)
        .sort((a, b) => b.createdAt - a.createdAt),
    [bookmarks],
  );

  return { progress, bookmarks, saveProgress, setCompleted, resumeAt, toggleBookmark, statsFor, bookmarksFor };
}
