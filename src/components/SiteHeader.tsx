import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

const NAV = [
  { to: "/businesses", label: "Businesses" },
  { to: "/movies", label: "Movies" },
  { to: "/motivation", label: "Motivation" },
] as const;

export function SiteHeader() {
  const { user, isStaff } = useAuth();
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };

  const links = (
    <>
      {NAV.map((n) => (
        <Link
          key={n.to}
          to={n.to}
          onClick={() => setOpen(false)}
          className="text-sm font-medium text-muted-foreground transition hover:text-foreground"
          activeProps={{ className: "text-foreground" }}
        >
          {n.label}
        </Link>
      ))}
      {user && (
        <Link to="/dashboard" onClick={() => setOpen(false)} className="text-sm font-medium text-muted-foreground hover:text-foreground" activeProps={{ className: "text-foreground" }}>
          My account
        </Link>
      )}
      {isStaff && (
        <Link to="/admin" onClick={() => setOpen(false)} className="text-sm font-medium text-gold hover:opacity-80">
          Admin
        </Link>
      )}
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link to="/" className="font-display text-3xl">
          ET<span className="text-primary">-</span>Tech
        </Link>
        <nav className="hidden items-center gap-7 md:flex">{links}</nav>
        <div className="hidden md:block">
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          ) : (
            <Button asChild variant="hero" size="sm"><Link to="/auth">Sign in</Link></Button>
          )}
        </div>
        <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu">
          {open ? <X /> : <Menu />}
        </button>
      </div>
      {open && (
        <div className="flex flex-col gap-4 border-t px-4 py-4 md:hidden">
          {links}
          {user ? (
            <Button variant="outline" size="sm" onClick={signOut}>Sign out</Button>
          ) : (
            <Button asChild variant="hero" size="sm"><Link to="/auth" onClick={() => setOpen(false)}>Sign in</Link></Button>
          )}
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t">
      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-10 text-sm text-muted-foreground md:flex-row md:justify-between">
        <p><span className="font-display text-xl text-foreground">ET-Tech</span> — Local business, great stories, daily fuel.</p>
        <div className="flex gap-6">
          <Link to="/privacy" className="hover:text-foreground">Privacy (POPIA)</Link>
          <span>Movie data by TMDB</span>
        </div>
      </div>
    </footer>
  );
}
