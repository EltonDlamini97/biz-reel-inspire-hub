import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { BookmarkPlus, BookmarkCheck, ExternalLink, Play } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { getMovie } from "@/lib/movies.functions";
import { justWatchUrl, trailerSearchUrl } from "@/lib/movies";
import { Button } from "@/components/ui/button";
import { MovieCard } from "@/components/MovieCard";

export const Route = createFileRoute("/movies/$id")({
  head: () => ({
    meta: [
      { title: "Movie — ET-Tech" },
      { name: "description", content: "Watch trailers, streaming options and build your watchlist." },
      { property: "og:title", content: "Movie — ET-Tech" },
      { property: "og:description", content: "Trailers, streaming options and recommendations." },
    ],
  }),
  component: MoviePage,
});

function MoviePage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();
  const { data: movie, isLoading } = useQuery({
    queryKey: ["movie", id],
    queryFn: () => getMovie({ data: { id } }),
  });
  const inList = useQuery({
    queryKey: ["watchlist", id],
    enabled: !!user,
    queryFn: async () =>
      !!(await supabase.from("watchlist").select("id").eq("user_id", user!.id).eq("movie_id", id).maybeSingle()).data,
  });

  if (isLoading) return <div className="p-12 text-muted-foreground">Loading…</div>;
  if (!movie) return <div className="p-12">Movie not found. <Link to="/movies" className="text-primary">Back to movies</Link></div>;

  const toggleWatch = async () => {
    if (!user) return;
    if (inList.data) {
      await supabase.from("watchlist").delete().eq("user_id", user.id).eq("movie_id", id);
      toast.success("Removed from watchlist");
    } else {
      await supabase.from("watchlist").insert({ user_id: user.id, movie_id: id, title: movie.title });
      toast.success("Added to watchlist");
    }
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  };

  return (
    <div>
      <div className="relative isolate">
        {movie.backdrop && (
          <img src={movie.backdrop} alt="" width={1280} height={720} className="h-72 w-full object-cover md:h-96" />
        )}
        <div className="absolute inset-0 bg-hero-fade" />
      </div>
      <div className="mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-[240px_1fr]">
          <div className="-mt-16">
            <div className="aspect-[2/3] overflow-hidden rounded-lg bg-poster ring-1 ring-border">
              {movie.poster
                ? <img src={movie.poster} alt={movie.title} className="h-full w-full object-cover" />
                : <div className="flex h-full items-end p-4"><span className="font-display text-3xl">{movie.title}</span></div>}
            </div>
          </div>
          <div className="py-6">
            <h1 className="font-display text-6xl">{movie.title}</h1>
            <p className="mt-1 text-muted-foreground">
              {movie.year}
              {movie.runtime ? ` · ${movie.runtime} min` : ""} · {movie.genres.join(", ")}
            </p>
            <p className="mt-6 max-w-2xl text-lg text-muted-foreground">{movie.overview}</p>
            <div className="mt-8 flex flex-wrap gap-3">
              {movie.trailerKey ? (
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 font-semibold text-primary-foreground shadow-glow hover:bg-primary/85"
                  href={`https://www.youtube.com/watch?v=${movie.trailerKey}`} target="_blank" rel="noreferrer noopener"
                ><Play className="h-4 w-4" /> Watch trailer</a>
              ) : (
                <a
                  className="inline-flex h-10 items-center gap-2 rounded-md bg-primary px-6 font-semibold text-primary-foreground shadow-glow hover:bg-primary/85"
                  href={trailerSearchUrl(movie.title, movie.year)} target="_blank" rel="noreferrer noopener"
                ><Play className="h-4 w-4" /> Find trailer</a>
              )}
              <Button variant="outline" asChild>
                <a href={justWatchUrl(movie.title)} target="_blank" rel="noreferrer noopener">
                  <ExternalLink className="h-4 w-4" /> Where to watch
                </a>
              </Button>
              {user && (
                <Button variant={inList.data ? "secondary" : "gold"} onClick={toggleWatch}>
                  {inList.data ? <BookmarkCheck className="h-4 w-4" /> : <BookmarkPlus className="h-4 w-4" />}
                  {inList.data ? "In watchlist" : "Add to watchlist"}
                </Button>
              )}
            </div>
            {movie.providers.length > 0 && (
              <div className="mt-8">
                <p className="text-xs font-semibold uppercase tracking-widest text-gold">Streaming in South Africa</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {movie.providers.map((p) => (
                    <span key={p.name} className="flex items-center gap-2 rounded-full border bg-card px-3 py-1.5 text-sm">
                      {p.logo && <img src={p.logo} alt="" className="h-4 w-4 rounded" />}{p.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
        {movie.recommendations.length > 0 && (
          <section className="mt-16 pb-10">
            <h2 className="mb-5 font-display text-4xl">You might also like</h2>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              {movie.recommendations.map((m) => <MovieCard key={m.id} movie={m} />)}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
