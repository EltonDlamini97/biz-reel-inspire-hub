import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { BadgeCheck, Globe, Mail, MapPin, Phone } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export const Route = createFileRoute("/businesses/$id")({
  head: () => ({
    meta: [
      { title: "Business profile — ET-Tech" },
      { name: "description", content: "View services, contact details and send an enquiry to this local business." },
      { property: "og:title", content: "Business profile — ET-Tech" },
      { property: "og:description", content: "Services, contact details and enquiries." },
    ],
  }),
  component: BusinessPage,
});

function BusinessPage() {
  const { id } = Route.useParams();
  const { user } = useAuth();
  const { data: b, isLoading } = useQuery({
    queryKey: ["business", id],
    queryFn: async () => (await supabase.from("businesses").select("*").eq("id", id).maybeSingle()).data,
  });
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [sending, setSending] = useState(false);

  if (isLoading) return <div className="p-12 text-muted-foreground">Loading…</div>;
  if (!b) return <div className="p-12">Business not found. <Link to="/businesses" className="text-primary">Back to directory</Link></div>;

  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!form.name.trim() || !form.email.includes("@") || form.message.trim().length < 5) {
      toast.error("Please fill in your name, a valid email and a message.");
      return;
    }
    setSending(true);
    const { error } = await supabase.from("enquiries").insert({
      business_id: b.id, sender_id: user.id,
      name: form.name.slice(0, 100), email: form.email.slice(0, 200), message: form.message.slice(0, 2000),
    });
    setSending(false);
    if (error) toast.error("Could not send enquiry.");
    else { toast.success("Enquiry sent!"); setForm({ name: "", email: "", message: "" }); }
  };

  return (
    <div className="mx-auto grid max-w-6xl gap-10 px-4 py-12 lg:grid-cols-[1fr_380px]">
      <div>
        <p className="text-xs uppercase tracking-widest text-gold">{b.category}</p>
        <h1 className="mt-2 flex items-center gap-3 font-display text-6xl">
          {b.name} {b.verified && <BadgeCheck className="h-8 w-8 text-success" />}
        </h1>
        {b.status !== "approved" && <p className="mt-2 rounded bg-gold/15 px-3 py-1 text-sm text-gold">Status: {b.status} — awaiting review</p>}
        <p className="mt-6 text-lg leading-relaxed text-muted-foreground">{b.description}</p>
        {b.services && (
          <>
            <h2 className="mt-10 font-display text-3xl">Products & services</h2>
            <div className="mt-4 flex flex-wrap gap-2">
              {b.services.split(",").map((s) => s.trim()).filter(Boolean).map((s) => (
                <span key={s} className="rounded-full border px-3 py-1 text-sm">{s}</span>
              ))}
            </div>
          </>
        )}
        <h2 className="mt-10 font-display text-3xl">Contact</h2>
        <ul className="mt-4 space-y-2 text-sm">
          <li className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /> {b.city}, {b.province}</li>
          {b.phone && <li className="flex items-center gap-2"><Phone className="h-4 w-4 text-primary" /> <a href={`tel:${b.phone}`}>{b.phone}</a></li>}
          {b.email && <li className="flex items-center gap-2"><Mail className="h-4 w-4 text-primary" /> <a href={`mailto:${b.email}`}>{b.email}</a></li>}
          {b.website && <li className="flex items-center gap-2"><Globe className="h-4 w-4 text-primary" /> <a href={b.website} target="_blank" rel="noreferrer noopener">{b.website}</a></li>}
        </ul>
        <a
          className="mt-4 inline-block text-sm text-primary hover:underline"
          target="_blank" rel="noreferrer noopener"
          href={`https://www.google.com/maps/search/${encodeURIComponent(`${b.name} ${b.city} ${b.province}`)}`}
        >View on map →</a>
      </div>
      <aside className="h-fit rounded-xl border bg-card p-6">
        <h2 className="font-display text-3xl">Send an enquiry</h2>
        {user ? (
          <form onSubmit={send} className="mt-4 space-y-3">
            <Input placeholder="Your name" maxLength={100} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
            <Input type="email" placeholder="Your email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
            <Textarea placeholder="How can they help?" maxLength={2000} rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} />
            <p className="text-xs text-muted-foreground">Your details are shared only with this business, per our <Link to="/privacy" className="underline">privacy policy</Link>.</p>
            <Button type="submit" variant="hero" className="w-full" disabled={sending}>{sending ? "Sending…" : "Send enquiry"}</Button>
          </form>
        ) : (
          <div className="mt-4">
            <p className="text-sm text-muted-foreground">Sign in to contact this business.</p>
            <Button asChild variant="hero" className="mt-4 w-full"><Link to="/auth">Sign in to enquire</Link></Button>
          </div>
        )}
      </aside>
    </div>
  );
}
