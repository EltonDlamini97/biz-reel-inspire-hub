import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { MovieCard } from "@/components/MovieCard";
import { GENRES } from "@/lib/movies";
import { listMovies } from "@/lib/movies.functions";

export const Route = createFileRoute("/movies/")({
  head: () => ({
    meta: [
      { title: "Movie Catalogue — ET-Tech" },
      { name: "description", content: "Browse trending movies, search by title and genre, and build your watchlist." },
      { property: "og:title", content: "Movie Catalogue — ET-Tech" },
      { property: "og:description", content: "Browse trending movies and build your watchlist." },
    ],
  }),
  component: Movies,
});

function Movies() {
  const [query, setQuery] = useState("");
  const [debounced, setDebounced] = useState("");
  const [genre, setGenre] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query), 400);
    return () => clearTimeout(t);
  }, [query]);

  const { data, isLoading } = useQuery({
    queryKey: ["movies", debounced, genre],
    queryFn: () => listMovies({ data: { query: debounced, genre } }),
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-6xl">Movie catalogue</h1>
      <p className="text-muted-foreground">Trending this week — search, filter and save to your watchlist.</p>
      {!data?.live && (
        <p className="mt-2 text-xs text-gold">Sample collection — connect a TMDB key for the full live catalogue.</p>
      )}
      <div className="mt-8 flex flex-col gap-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search movies…" value={query} onChange={(e) => setQuery(e.target.value)} />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setGenre("")}
            className={`rounded-full border px-3 py-1 text-sm transition ${!genre ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}
          >All</button>
          {GENRES.map((g) => (
            <button
              key={g}
              onClick={() => setGenre(g === genre ? "" : g)}
              className={`rounded-full border px-3 py-1 text-sm transition ${g === genre ? "border-primary bg-primary text-primary-foreground" : "hover:border-primary"}`}
            >{g}</button>
          ))}
        </div>
      </div>
      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading…</p>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {data?.movies.map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
      )}
      {data?.movies.length === 0 && <p className="mt-10 text-muted-foreground">No movies found.</p>}
    </div>
  );
}
