import { Link } from "@tanstack/react-router";
import { Star } from "lucide-react";
import type { Movie } from "@/lib/movies";

export function MovieCard({ movie }: { movie: Movie }) {
  return (
    <Link to="/movies/$id" params={{ id: movie.id }} className="group block">
      <div className="relative aspect-[2/3] overflow-hidden rounded-lg bg-poster ring-1 ring-border transition group-hover:-translate-y-1 group-hover:shadow-glow">
        {movie.poster ? (
          <img src={movie.poster} alt={movie.title} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col justify-end p-4">
            <span className="font-display text-3xl leading-none text-foreground">{movie.title}</span>
            <span className="mt-1 text-xs text-muted-foreground">{movie.year}</span>
          </div>
        )}
        <span className="absolute right-2 top-2 flex items-center gap-1 rounded bg-background/80 px-1.5 py-0.5 text-xs font-semibold text-gold">
          <Star className="h-3 w-3 fill-current" /> {movie.rating}
        </span>
      </div>
      <p className="mt-2 truncate text-sm font-semibold">{movie.title}</p>
      <p className="text-xs text-muted-foreground">{movie.year} · {movie.genres.slice(0, 2).join(", ")}</p>
    </Link>
  );
}
