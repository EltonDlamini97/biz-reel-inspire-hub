import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { CalendarCheck, Copy, Quote, Share2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { dayIndex } from "@/lib/daily";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/motivation")({
  head: () => ({
    meta: [
      { title: "Daily Motivation — ET-Tech" },
      { name: "description", content: "Daily quotes, success stories, challenges and personal development articles." },
      { property: "og:title", content: "Daily Motivation — ET-Tech" },
      { property: "og:description", content: "Daily quotes, success stories and challenges." },
    ],
  }),
  component: Motivation,
});

function Motivation() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const quotes = useQuery({
    queryKey: ["quotes"],
    queryFn: async () => (await supabase.from("quotes").select("*").order("created_at")).data ?? [],
  });
  const articles = useQuery({
    queryKey: ["articles"],
    queryFn: async () => (await supabase.from("articles").select("*").order("created_at", { ascending: false })).data ?? [],
  });
  const challenges = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => (await supabase.from("challenges").select("*").order("created_at")).data ?? [],
  });
  const [form, setForm] = useState({ text: "", author: "" });
  const [sending, setSending] = useState(false);

  const quote = quotes.data?.[dayIndex(quotes.data.length)];
  const challenge = challenges.data?.[dayIndex(challenges.data.length)];
  const stories = (articles.data ?? []).filter((a) => a.kind === "story");
  const tips = (articles.data ?? []).filter((a) => a.kind !== "story");

  const share = async (text: string, author: string) => {
    const payload = `"${text}" — ${author}`;
    if (navigator.share) {
      try { await navigator.share({ text: payload, title: "Daily motivation" }); } catch { /* cancelled */ }
    } else {
      await navigator.clipboard.writeText(payload);
      toast.success("Quote copied to clipboard");
    }
  };

  const submitQuote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (form.text.trim().length < 10 || form.text.length > 500) {
      toast.error("Quote must be 10–500 characters.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("quotes").insert({
      text: form.text.trim(), author: form.author.trim().slice(0, 80) || "Unknown", submitted_by: user.id,
    });
    setSending(false);
    if (error) toast.error("Could not submit quote.");
    else { toast.success("Quote submitted — an editor will review it."); setForm({ text: "", author: "" }); qc.invalidateQueries({ queryKey: ["quotes"] }); }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <h1 className="font-display text-6xl">Daily motivation</h1>
      <p className="text-muted-foreground">Start every day with fuel for the journey.</p>

      {quote && (
        <div className="mt-8 rounded-2xl bg-poster p-10 text-center shadow-glow md:p-16">
          <Quote className="mx-auto h-10 w-10 text-gold" />
          <p className="mx-auto mt-6 max-w-3xl font-display text-4xl leading-tight md:text-6xl">"{quote.text}"</p>
          <p className="mt-4 text-muted-foreground">— {quote.author}</p>
          <Button variant="gold" className="mt-6" onClick={() => share(quote.text, quote.author)}>
            <Share2 className="h-4 w-4" /> Share this quote
          </Button>
        </div>
      )}

      {challenge && (
        <div className="mt-8 flex items-start gap-4 rounded-xl border border-gold/40 bg-card p-6">
          <CalendarCheck className="h-8 w-8 shrink-0 text-gold" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Today's challenge</p>
            <p className="mt-1 text-lg font-bold">{challenge.title}</p>
            <p className="text-sm text-muted-foreground">{challenge.description}</p>
          </div>
        </div>
      )}

      <div className="mt-16 grid gap-6 lg:grid-cols-3">
        {stories.map((a) => (
          <article key={a.id} className="rounded-xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-gold">Success story</p>
            <h2 className="mt-2 text-xl font-bold">{a.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>
            <p className="mt-4 text-sm leading-relaxed">{a.body}</p>
          </article>
        ))}
        {tips.map((a) => (
          <article key={a.id} className="rounded-xl border bg-card p-6">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary">Personal growth</p>
            <h2 className="mt-2 text-xl font-bold">{a.title}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{a.summary}</p>
            <p className="mt-4 text-sm leading-relaxed">{a.body}</p>
          </article>
        ))}
      </div>

      <section className="mt-16 rounded-xl border bg-card p-6 md:p-10">
        <h2 className="font-display text-4xl">Share a quote</h2>
        <p className="text-sm text-muted-foreground">Submit an inspirational quote — editors review before publishing.</p>
        {user ? (
          <form onSubmit={submitQuote} className="mt-6 grid gap-3 md:grid-cols-[1fr_220px_auto]">
            <Input placeholder="The quote…" maxLength={500} value={form.text} onChange={(e) => setForm({ ...form, text: e.target.value })} />
            <Input placeholder="Author" maxLength={80} value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} />
            <Button type="submit" variant="hero" disabled={sending}>{sending ? "Sending…" : "Submit"}</Button>
          </form>
        ) : (
          <p className="mt-4 text-sm">Sign in to submit a quote.</p>
        )}
      </section>

      <section className="mt-16">
        <h2 className="font-display text-4xl">Quote wall</h2>
        <div className="mt-6 columns-1 gap-4 sm:columns-2 lg:columns-3">
          {(quotes.data ?? []).filter((q) => q.id !== quote?.id).map((q) => (
            <div key={q.id} className="group mb-4 break-inside-avoid rounded-xl border bg-card p-5">
              <p className="text-sm">"{q.text}"</p>
              <div className="mt-3 flex items-center justify-between">
                <p className="text-xs text-muted-foreground">— {q.author}</p>
                <button onClick={() => share(q.text, q.author)} className="text-muted-foreground opacity-0 transition group-hover:opacity-100" aria-label="Share quote">
                  <Copy className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
