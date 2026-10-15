import { createServerFn } from "@tanstack/react-start";
import { SAMPLE_MOVIES, type Movie, type MovieDetail } from "./movies";

const IMG = "https://image.tmdb.org/t/p/";
const GENRE_MAP: Record<number, string> = {
  28: "Action", 12: "Adventure", 16: "Animation", 35: "Comedy", 80: "Crime", 99: "Documentary",
  18: "Drama", 10751: "Family", 14: "Fantasy", 36: "History", 27: "Horror", 10402: "Music",
  9648: "Mystery", 10749: "Romance", 878: "Sci-Fi", 53: "Thriller", 10752: "War", 37: "Western",
};
const NAME_TO_ID = Object.fromEntries(Object.entries(GENRE_MAP).map(([k, v]) => [v, k]));

async function tmdb(path: string, params: Record<string, string> = {}) {
  const key = process.env["TMDB_API_KEY"];
  if (!key) return null;
  const url = new URL(`https://api.themoviedb.org/3${path}`);
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  const headers: Record<string, string> = { accept: "application/json" };
  if (key.length > 40) headers.Authorization = `Bearer ${key}`;
  else url.searchParams.set("api_key", key);
  const res = await fetch(url, { headers });
  if (!res.ok) {
    console.error("TMDB error", res.status);
    return null;
  }
  return res.json();
}

type TmdbMovie = {
  id: number; title: string; release_date?: string; overview: string; vote_average: number;
  poster_path: string | null; backdrop_path: string | null; genre_ids?: number[]; genres?: { name: string }[];
};
const map = (m: TmdbMovie): Movie => ({
  id: String(m.id),
  title: m.title,
  year: (m.release_date ?? "").slice(0, 4),
  overview: m.overview,
  rating: Math.round(m.vote_average * 10) / 10,
  poster: m.poster_path ? `${IMG}w500${m.poster_path}` : null,
  backdrop: m.backdrop_path ? `${IMG}w1280${m.backdrop_path}` : null,
  genres: m.genres ? m.genres.map((g) => g.name) : (m.genre_ids ?? []).map((g) => GENRE_MAP[g]).filter(Boolean),
});

export const listMovies = createServerFn({ method: "GET" })
  .inputValidator((d: { query?: string; genre?: string }) => d)
  .handler(async ({ data }): Promise<{ movies: Movie[]; live: boolean }> => {
    const q = data.query?.trim();
    let json;
    if (q) json = await tmdb("/search/movie", { query: q, region: "ZA" });
    else if (data.genre && NAME_TO_ID[data.genre])
      json = await tmdb("/discover/movie", { with_genres: NAME_TO_ID[data.genre], sort_by: "popularity.desc" });
    else json = await tmdb("/trending/movie/week");
    if (json) return { movies: (json.results as TmdbMovie[]).slice(0, 20).map(map), live: true };

    let movies = SAMPLE_MOVIES;
    if (q) movies = movies.filter((m) => m.title.toLowerCase().includes(q.toLowerCase()));
    if (data.genre) movies = movies.filter((m) => m.genres.includes(data.genre!));
    return { movies, live: false };
  });

export const getMovie = createServerFn({ method: "GET" })
  .inputValidator((d: { id: string }) => d)
  .handler(async ({ data }): Promise<MovieDetail | null> => {
    if (data.id.startsWith("s")) {
      const m = SAMPLE_MOVIES.find((x) => x.id === data.id);
      if (!m) return null;
      return {
        ...m, runtime: null, trailerKey: null, providers: [], providerLink: null,
        recommendations: SAMPLE_MOVIES.filter((x) => x.id !== m.id && x.genres.some((g) => m.genres.includes(g))).slice(0, 6),
      };
    }
    const json = await tmdb(`/movie/${encodeURIComponent(data.id)}`, {
      append_to_response: "videos,recommendations,watch/providers",
    });
    if (!json) return null;
    const trailer = (json.videos?.results ?? []).find(
      (v: { site: string; type: string }) => v.site === "YouTube" && v.type === "Trailer",
    );
    const za = json["watch/providers"]?.results?.ZA;
    const providers = [...(za?.flatrate ?? []), ...(za?.rent ?? [])]
      .slice(0, 6)
      .map((p: { provider_name: string; logo_path: string | null }) => ({
        name: p.provider_name, logo: p.logo_path ? `${IMG}w92${p.logo_path}` : null,
      }));
    return {
      ...map(json), runtime: json.runtime ?? null, trailerKey: trailer?.key ?? null,
      providers, providerLink: za?.link ?? null,
      recommendations: ((json.recommendations?.results ?? []) as TmdbMovie[]).slice(0, 6).map(map),
    };
  });
