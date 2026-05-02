import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface ActorFilm {
  id: number;
  title: string;
  character: string;
  releaseDate: string;
  year: number | null;
  poster: string | null;
  rating: number;
  voteCount: number;
  popularity: number;
  language: string;
  overview: string;
}

export interface ActorInfo {
  id: number;
  name: string;
  profile: string | null;
  biography: string;
  birthday: string | null;
  placeOfBirth: string | null;
  knownForDepartment: string;
  popularity: number;
  totalMovies: number;
  releasedCount: number;
  upcomingCount: number;
}

export interface ActorFilmsData {
  actor: ActorInfo;
  released: ActorFilm[];
  upcoming: ActorFilm[];
  topRated: ActorFilm[];
}

export function useActorFilms() {
  const [data, setData] = useState<ActorFilmsData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchActor = useCallback(async (name: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const { data: result, error: fnError } = await supabase.functions.invoke("actor-films", {
        body: { name },
      });
      if (fnError) throw fnError;
      if (result?.error) throw new Error(result.error);
      setData(result as ActorFilmsData);
    } catch (err) {
      console.error("Failed to fetch actor films:", err);
      setError(err instanceof Error ? err.message : "Failed to load actor");
      setData(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  return { data, isLoading, error, fetchActor };
}