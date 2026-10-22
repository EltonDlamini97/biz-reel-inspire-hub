import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Bookmark, Building2, Inbox, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "My account — ET-Tech" },
      { name: "description", content: "Manage your business listings, enquiries, watchlist and quotes." },
      { property: "og:title", content: "My account — ET-Tech" },
      { property: "og:description", content: "Your listings, enquiries and watchlist." },
    ],
  }),
  component: Dashboard,
});

export function Dashboard() {
  const { user, roles } = useAuth();
  const qc = useQueryClient();

  const myBusinesses = useQuery({
    queryKey: ["my-businesses", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("businesses").select("*").eq("owner_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });
  const enquiries = useQuery({
    queryKey: ["my-enquiries", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const mine = await supabase.from("businesses").select("id").eq("owner_id", user!.id);
      const ids = (mine.data ?? []).map((b) => b.id);
      if (!ids.length) return [];
      return (await supabase.from("enquiries").select("*").in("business_id", ids).order("created_at", { ascending: false })).data ?? [];
    },
  });
  const watchlist = useQuery({
    queryKey: ["watchlist-all", user?.id],
    enabled: !!user,
    queryFn: async () =>
      (await supabase.from("watchlist").select("*").eq("user_id", user!.id).order("created_at", { ascending: false })).data ?? [],
  });

  const removeWatch = async (movieId: string) => {
    await supabase.from("watchlist").delete().eq("user_id", user!.id).eq("movie_id", movieId);
    qc.invalidateQueries({ queryKey: ["watchlist"] });
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl">My account</h1>
          <p className="text-muted-foreground">{user?.email}</p>
          {roles.length > 1 && <p className="mt-1 text-xs text-gold">Roles: {roles.join(", ")}</p>}
        </div>
        <Button asChild variant="gold"><Link to="/business-new">List a business</Link></Button>
      </div>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-display text-4xl"><Building2 className="h-6 w-6 text-primary" /> My listings</h2>
        <div className="mt-5 space-y-3">
          {myBusinesses.data?.length === 0 && <p className="text-sm text-muted-foreground">You haven't listed a business yet.</p>}
          {myBusinesses.data?.map((b) => (
            <div key={b.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-card p-4">
              <div>
                <Link to="/businesses/$id" params={{ id: b.id }} className="font-semibold hover:text-primary">{b.name}</Link>
                <p className="text-xs text-muted-foreground">{b.category} · {b.city}</p>
              </div>
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${b.status === "approved" ? "bg-success/15 text-success" : "bg-gold/15 text-gold"}`}>
                {b.status === "approved" ? "Live" : b.status}
              </span>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-display text-4xl"><Inbox className="h-6 w-6 text-primary" /> Enquiries received</h2>
        <div className="mt-5 space-y-3">
          {enquiries.data?.length === 0 && <p className="text-sm text-muted-foreground">No enquiries yet — they'll appear here when customers contact you.</p>}
          {enquiries.data?.map((e) => (
            <div key={e.id} className="rounded-xl border bg-card p-4">
              <div className="flex flex-wrap justify-between gap-2 text-sm">
                <p className="font-semibold">{e.name} <span className="font-normal text-muted-foreground">· {e.email}</span></p>
                <p className="text-xs text-muted-foreground">{new Date(e.created_at).toLocaleDateString("en-ZA")}</p>
              </div>
              <p className="mt-2 text-sm text-muted-foreground">{e.message}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-display text-4xl"><Bookmark className="h-6 w-6 text-primary" /> My watchlist</h2>
        <div className="mt-5 space-y-2">
          {watchlist.data?.length === 0 && <p className="text-sm text-muted-foreground">Nothing saved yet — browse <Link to="/movies" className="text-primary">movies</Link>.</p>}
          {watchlist.data?.map((w) => (
            <div key={w.id} className="flex items-center justify-between rounded-xl border bg-card p-4">
              <Link to="/movies/$id" params={{ id: w.movie_id }} className="text-sm font-medium hover:text-primary">{w.title}</Link>
              <button onClick={() => removeWatch(w.movie_id)} className="text-xs text-muted-foreground hover:text-destructive">Remove</button>
            </div>
          ))}
        </div>
      </section>

      <section className="mt-12 mb-10">
        <h2 className="flex items-center gap-2 font-display text-4xl"><Quote className="h-6 w-6 text-primary" /> My quotes</h2>
        <p className="mt-2 text-sm text-muted-foreground">Quotes you submitted appear on the <Link to="/motivation" className="text-primary">motivation page</Link> once an editor approves them.</p>
      </section>
    </div>
  );
}
