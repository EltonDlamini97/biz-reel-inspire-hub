import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { Mail } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in — ET-Tech" },
      { name: "description", content: "Sign in or create your ET-Tech account." },
      { property: "og:title", content: "Sign in — ET-Tech" },
      { property: "og:description", content: "Sign in or create your ET-Tech account." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirmSent, setConfirmSent] = useState(false);

  if (!loading && user) {
    navigate({ to: "/dashboard", replace: true });
  }

  const google = async () => {
    const result = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (result.error) toast.error("Google sign-in failed. Please try again.");
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.includes("@") || password.length < 6) {
      toast.error("Enter a valid email and a password of at least 6 characters.");
      return;
    }
    setBusy(true);
    if (mode === "signup") {
      if (!consent) { setBusy(false); toast.error("Please accept the privacy notice to continue."); return; }
      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: {
          emailRedirectTo: window.location.origin,
          data: { display_name: displayName.slice(0, 60) || email.split("@")[0], popia_consent: consent },
        },
      });
      setBusy(false);
      if (error) { toast.error(error.message); return; }
      if (data.session === null) { setConfirmSent(true); return; }
      navigate({ to: "/dashboard" });
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setBusy(false);
      if (error) { toast.error("Sign-in failed — check your email and password."); return; }
      navigate({ to: "/dashboard" });
    }
  };

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20">
      <h1 className="font-display text-5xl">{mode === "signin" ? "Welcome back" : "Create account"}</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        {mode === "signin" ? "Sign in to enquire, save watchlists and share quotes." : "Join to support local business and get daily motivation."}
      </p>

      {confirmSent ? (
        <div className="mt-8 rounded-xl border bg-card p-6 text-center">
          <Mail className="mx-auto h-8 w-8 text-gold" />
          <p className="mt-3 font-semibold">Check your email</p>
          <p className="mt-1 text-sm text-muted-foreground">We sent a confirmation link to {email}. Click it to activate your account, then sign in.</p>
          <Button variant="outline" className="mt-4" onClick={() => { setConfirmSent(false); setMode("signin"); }}>Back to sign in</Button>
        </div>
      ) : (
        <>
          <Button variant="outline" className="mt-8" onClick={google}>
            <svg viewBox="0 0 24 24" className="h-4 w-4"><path fill="#EA4335" d="M12 5.04c1.62 0 3.06.56 4.2 1.64l3.12-3.12C17.46 1.8 14.96.75 12 .75 7.4.75 3.44 3.4 1.53 7.26l3.66 2.84C6.09 7.14 8.81 5.04 12 5.04z"/><path fill="#4285F4" d="M23.25 12.27c0-.79-.07-1.55-.2-2.27H12v4.51h6.32c-.27 1.46-1.1 2.7-2.33 3.53l3.59 2.78c2.09-1.93 3.67-4.78 3.67-8.55z"/><path fill="#FBBC05" d="M5.19 14.28A6.9 6.9 0 0 1 4.81 12c0-.79.14-1.56.38-2.28L1.53 6.88A11.24 11.24 0 0 0 .75 12c0 1.81.43 3.52 1.19 5.03l3.25-2.75z"/><path fill="#34A853" d="M12 23.25c3.04 0 5.59-1 7.45-2.72l-3.55-2.75c-.99.66-2.25 1.05-3.9 1.05-3.19 0-5.91-2.1-6.81-5.02l-3.66 2.84c1.91 3.86 5.87 6.6 10.47 6.6z"/></svg>
            Continue with Google
          </Button>
          <div className="my-6 flex items-center gap-3 text-xs text-muted-foreground">
            <span className="h-px flex-1 bg-border" /> or with email <span className="h-px flex-1 bg-border" />
          </div>
          <form onSubmit={submit} className="space-y-3">
            {mode === "signup" && (
              <Input placeholder="Display name" maxLength={60} value={displayName} onChange={(e) => setDisplayName(e.target.value)} />
            )}
            <Input type="email" placeholder="Email" value={email} onChange={(e) => setEmail(e.target.value)} />
            <Input type="password" placeholder="Password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
            {mode === "signup" && (
              <label className="flex items-start gap-2 text-xs text-muted-foreground">
                <input type="checkbox" className="mt-0.5" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
                <span>I agree that ET-Tech may store my email and display name to run my account, per the <a href="/privacy" className="underline">privacy notice (POPIA)</a>.</span>
              </label>
            )}
            <Button type="submit" variant="hero" className="w-full" disabled={busy}>
              {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
            </Button>
          </form>
          <p className="mt-6 text-center text-sm text-muted-foreground">
            {mode === "signin" ? "New here? " : "Already have an account? "}
            <button className="text-primary underline" onClick={() => { setMode(mode === "signin" ? "signup" : "signin"); setConfirmSent(false); }}>
              {mode === "signin" ? "Create an account" : "Sign in"}
            </button>
          </p>
        </>
      )}
    </div>
  );
}
