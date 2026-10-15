import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { BusinessCard } from "@/components/BusinessCard";

export const CATEGORIES = ["Food & Catering", "Technology", "Fashion", "Home & Garden", "Automotive", "Education", "Health & Beauty", "Professional Services", "Other"];
export const PROVINCES = ["Eastern Cape", "Free State", "Gauteng", "KwaZulu-Natal", "Limpopo", "Mpumalanga", "North West", "Northern Cape", "Western Cape"];

export const Route = createFileRoute("/businesses/")({
  head: () => ({
    meta: [
      { title: "SMME Business Directory — ET-Tech" },
      { name: "description", content: "Search verified South African small businesses by category and province." },
      { property: "og:title", content: "SMME Business Directory — ET-Tech" },
      { property: "og:description", content: "Search verified South African small businesses." },
    ],
  }),
  component: Directory,
});

function Directory() {
  const [q, setQ] = useState("");
  const [cat, setCat] = useState("");
  const [prov, setProv] = useState("");
  const [verifiedOnly, setVerifiedOnly] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["businesses", q, cat, prov, verifiedOnly],
    queryFn: async () => {
      let query = supabase.from("businesses").select("*").eq("status", "approved")
        .order("featured", { ascending: false }).order("created_at", { ascending: false });
      if (q) query = query.or(`name.ilike.%${q.replace(/[%,()]/g, "")}%,description.ilike.%${q.replace(/[%,()]/g, "")}%,services.ilike.%${q.replace(/[%,()]/g, "")}%`);
      if (cat) query = query.eq("category", cat);
      if (prov) query = query.eq("province", prov);
      if (verifiedOnly) query = query.eq("verified", true);
      return (await query).data ?? [];
    },
  });

  const select = "h-9 rounded-md border border-input bg-background px-3 text-sm";
  return (
    <div className="mx-auto max-w-7xl px-4 py-12">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-6xl">Business directory</h1>
          <p className="text-muted-foreground">Find and support local SMMEs across South Africa.</p>
        </div>
        <Button asChild variant="gold"><Link to="/business-new">List your business</Link></Button>
      </div>
      <div className="mt-8 flex flex-wrap gap-3">
        <Input placeholder="Search name, service…" value={q} onChange={(e) => setQ(e.target.value)} className="max-w-xs" />
        <select className={select} value={cat} onChange={(e) => setCat(e.target.value)}>
          <option value="">All categories</option>
          {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <select className={select} value={prov} onChange={(e) => setProv(e.target.value)}>
          <option value="">All provinces</option>
          {PROVINCES.map((c) => <option key={c}>{c}</option>)}
        </select>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={verifiedOnly} onChange={(e) => setVerifiedOnly(e.target.checked)} /> Verified only
        </label>
      </div>
      <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {data?.map((b) => <BusinessCard key={b.id} b={b} />)}
      </div>
      {!isLoading && data?.length === 0 && <p className="mt-10 text-muted-foreground">No businesses match your search.</p>}
    </div>
  );
}
