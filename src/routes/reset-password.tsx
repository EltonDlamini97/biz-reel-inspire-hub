import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Reset password — ET-Tech" },
      { name: "description", content: "Set a new password for your ET-Tech account." },
    ],
  }),
  component: ResetPassword,
});

function ResetPassword() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const isRecovery = window.location.hash.includes("type=recovery");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) { toast.error("Password must be at least 6 characters."); return; }
    setBusy(true);
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) toast.error("Could not update password. Please use the link from a fresh email.");
    else { toast.success("Password updated — you can sign in now."); navigate({ to: "/auth" }); }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-24">
      <h1 className="font-display text-5xl">Set new password</h1>
      {isRecovery ? (
        <form onSubmit={submit} className="mt-8 space-y-4">
          <Input type="password" placeholder="New password (min 6 characters)" value={password} onChange={(e) => setPassword(e.target.value)} />
          <Button type="submit" variant="hero" className="w-full" disabled={busy}>{busy ? "Saving…" : "Save password"}</Button>
        </form>
      ) : (
        <div className="mt-6 space-y-4">
          <p className="text-sm text-muted-foreground">This page opens from a password-reset email link. If you arrived here by accident, request a reset or sign in below.</p>
          <Button asChild variant="outline" className="w-full"><a href="/auth">Go to sign in</a></Button>
        </div>
      )}
    </div>
  );
}
