import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { CATEGORIES, PROVINCES } from "./businesses.index";

export const Route = createFileRoute("/business-new")({
  head: () => ({
    meta: [
      { title: "List your business — ET-Tech" },
      { name: "description", content: "Register your SMME on ET-Tech and reach local customers." },
      { property: "og:title", content: "List your business — ET-Tech" },
      { property: "og:description", content: "Register your SMME and reach local customers." },
    ],
  }),
  component: BusinessNew,
});

const select = "h-9 rounded-md border border-input bg-background px-3 text-sm";

function BusinessNew() {
  const { user } = useAuth();
  const [form, setForm] = useState({
    name: "", category: "", description: "", services: "", city: "", province: "", phone: "", email: "", website: "",
  });
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-5xl">List your business</h1>
        <p className="mt-3 text-muted-foreground">Create a free account first — then tell customers about your business.</p>
        <Button asChild variant="hero" className="mt-6"><Link to="/auth">Sign in / register</Link></Button>
      </div>
    );
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <h1 className="font-display text-5xl text-success">Submitted!</h1>
        <p className="mt-3 text-muted-foreground">Your listing is awaiting review. We'll verify your details and publish it shortly — you can track its status in <Link to="/dashboard" className="text-primary underline">My account</Link>.</p>
      </div>
    );
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.category || !form.description.trim() || !form.city.trim() || !form.province) {
      toast.error("Please complete name, category, description, city and province.");
      return;
    }
    if (form.email && !form.email.includes("@")) { toast.error("Enter a valid contact email."); return; }
    setBusy(true);
    const { error } = await supabase.from("businesses").insert({
      owner_id: user.id,
      name: form.name.trim().slice(0, 120),
      category: form.category,
      description: form.description.trim().slice(0, 2000),
      services: form.services.trim().slice(0, 500),
      city: form.city.trim().slice(0, 80),
      province: form.province,
      phone: form.phone.trim().slice(0, 30) || null,
      email: form.email.trim().slice(0, 200) || null,
      website: form.website.trim().slice(0, 300) || null,
    });
    setBusy(false);
    if (error) toast.error("Could not submit — please try again.");
    else setDone(true);
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      <h1 className="font-display text-6xl">List your business</h1>
      <p className="text-muted-foreground">Free listing. Our team verifies before publishing.</p>
      <form onSubmit={submit} className="mt-8 space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="Business name *" maxLength={120} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <select className={select} value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            <option value="">Category *</option>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <Textarea placeholder="Describe your business *" maxLength={2000} rows={4} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
        <Input placeholder="Products / services (comma-separated)" maxLength={500} value={form.services} onChange={(e) => setForm({ ...form, services: e.target.value })} />
        <div className="grid gap-4 sm:grid-cols-2">
          <Input placeholder="City *" maxLength={80} value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <select className={select} value={form.province} onChange={(e) => setForm({ ...form, province: e.target.value })}>
            <option value="">Province *</option>
            {PROVINCES.map((c) => <option key={c}>{c}</option>)}
          </select>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          <Input placeholder="Phone" maxLength={30} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <Input type="email" placeholder="Contact email" maxLength={200} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <Input placeholder="Website (optional)" maxLength={300} value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
        <p className="text-xs text-muted-foreground">By submitting you confirm you represent this business and accept our <Link to="/privacy" className="underline">privacy notice</Link>.</p>
        <Button type="submit" variant="hero" size="lg" disabled={busy}>{busy ? "Submitting…" : "Submit for review"}</Button>
      </form>
    </div>
  );
}
