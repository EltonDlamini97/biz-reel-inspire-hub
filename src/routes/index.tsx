import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Quote } from "lucide-react";
import hero from "@/assets/hero.jpg";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCard } from "@/components/BusinessCard";
import { MovieCard } from "@/components/MovieCard";
import { listMovies } from "@/lib/movies.functions";
import { dayIndex } from "@/lib/daily";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ET-Tech — Local Business, Movies & Daily Motivation" },
      { name: "description", content: "Find trusted South African SMMEs, explore cinematic movie picks and get your daily dose of motivation." },
      { property: "og:title", content: "ET-Tech — Local Business, Movies & Daily Motivation" },
      { property: "og:description", content: "Find trusted SMMEs, explore movies and get daily motivation." },
    ],
  }),
  component: Home,
});

function Home() {
  const featured = useQuery({
    queryKey: ["businesses", "featured"],
    queryFn: async () => (await supabase.from("businesses").select("*").eq("featured", true).limit(3)).data ?? [],
  });
  const movies = useQuery({ queryKey: ["movies", "", ""], queryFn: () => listMovies({ data: {} }) });
  const quotes = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => (await supabase.from("quotes").select("*").order("created_at")).data ?? [],
  });
  const quote = quotes.data?.[dayIndex(quotes.data.length)];

  return (
    <>
      <section className="relative isolate flex min-h-[85vh] items-end overflow-hidden">
        <img src={hero} alt="Johannesburg skyline at sunset" width={1920} height={1088} className="absolute inset-0 -z-20 h-full w-full object-cover" />
        <div className="absolute inset-0 -z-10 bg-hero-fade" />
        <div className="mx-auto w-full max-w-7xl px-4 pb-20">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-gold">Support local · Watch great · Grow daily</p>
          <h1 className="mt-4 max-w-4xl font-display text-6xl leading-[0.9] md:text-8xl">
            Where local business meets <span className="text-primary">big stories</span>
          </h1>
          <p className="mt-6 max-w-xl text-lg text-muted-foreground">
            Discover trusted small businesses, find your next favourite film, and start every day inspired.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild variant="hero" size="lg"><Link to="/businesses">Explore businesses</Link></Button>
            <Button asChild variant="outline" size="lg"><Link to="/movies">Browse movies</Link></Button>
          </div>
        </div>
      </section>

      {quote && (
        <section className="mx-auto max-w-7xl px-4">
          <Link to="/motivation" className="-mt-10 flex items-start gap-4 rounded-xl border bg-card p-6 shadow-glow md:p-8">
            <Quote className="h-8 w-8 shrink-0 text-gold" />
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gold">Today's quote</p>
              <p className="mt-2 text-xl font-semibold md:text-2xl">"{quote.text}"</p>
              <p className="mt-1 text-sm text-muted-foreground">— {quote.author}</p>
            </div>
          </Link>
        </section>
      )}

      <Section title="Featured businesses" to="/businesses">
        <div className="grid gap-5 md:grid-cols-3">
          {featured.data?.map((b) => <BusinessCard key={b.id} b={b} />)}
        </div>
      </Section>

      <Section title="Trending movies" to="/movies">
        <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
          {movies.data?.movies.slice(0, 6).map((m) => <MovieCard key={m.id} movie={m} />)}
        </div>
      </Section>

      <section className="mx-auto mt-24 max-w-7xl px-4">
        <div className="rounded-2xl bg-gold-gradient p-10 text-gold-foreground md:p-14">
          <h2 className="font-display text-5xl">Own a small business?</h2>
          <p className="mt-2 max-w-lg">List it for free, get verified and start receiving enquiries from customers near you.</p>
          <Button asChild className="mt-6" size="lg"><Link to="/business-new">List your business</Link></Button>
        </div>
      </section>
    </>
  );
}

function Section({ title, to, children }: { title: string; to: "/businesses" | "/movies"; children: React.ReactNode }) {
  return (
    <section className="mx-auto mt-20 max-w-7xl px-4">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="font-display text-4xl md:text-5xl">{title}</h2>
        <Link to={to} className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
          See all <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
      {children}
    </section>
  );
}
