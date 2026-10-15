import { Link } from "@tanstack/react-router";
import { BadgeCheck, MapPin, Sparkles } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

export type Business = Database["public"]["Tables"]["businesses"]["Row"];

export function BusinessCard({ b }: { b: Business }) {
  return (
    <Link
      to="/businesses/$id"
      params={{ id: b.id }}
      className="group flex flex-col rounded-xl border bg-card p-5 transition hover:border-primary/60 hover:shadow-glow"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-secondary font-display text-2xl text-primary">
          {b.name.charAt(0)}
        </div>
        <div className="flex gap-1">
          {b.featured && (
            <span className="flex items-center gap-1 rounded-full bg-gold/15 px-2 py-0.5 text-xs font-medium text-gold">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
          {b.verified && (
            <span className="flex items-center gap-1 rounded-full bg-success/15 px-2 py-0.5 text-xs font-medium text-success">
              <BadgeCheck className="h-3 w-3" /> Verified
            </span>
          )}
        </div>
      </div>
      <h3 className="mt-4 text-lg font-bold group-hover:text-primary">{b.name}</h3>
      <p className="text-xs uppercase tracking-wider text-muted-foreground">{b.category}</p>
      <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{b.description}</p>
      <p className="mt-auto flex items-center gap-1 pt-4 text-xs text-muted-foreground">
        <MapPin className="h-3 w-3" /> {b.city}, {b.province}
      </p>
    </Link>
  );
}
