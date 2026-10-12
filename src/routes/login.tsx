import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const { signIn, user, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [networkError, setNetworkError] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      navigate({ to: "/" });
    }
  }, [loading, user, navigate]);

  const envMissing = !import.meta.env['VITE_SUPABASE_URL'] || !import.meta.env['VITE_SUPABASE_ANON_KEY'];

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setNetworkError(false);
    setSubmitting(true);
    try {
      const { error } = await signIn(email, password);
      setSubmitting(false);
      if (error) {
        console.error("Login error:", error);
        setError(error.message);
        if (error.message.includes("Cannot reach the server")) {
          setNetworkError(true);
        }
        toast.error(error.message);
      } else {
        toast.success("Logged in");
        navigate({ to: "/" });
      }
    } catch (err) {
      console.error("Login exception:", err);
      setSubmitting(false);
      const msg = err instanceof Error ? err.message : "An unexpected error occurred";
      setError(msg);
      toast.error(msg);
    }
  }

  function handleRetry() {
    setError("");
    setNetworkError(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (user) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          <img src="/bm-logo.jpeg" alt="BM Store" className="mx-auto h-20 w-20 rounded-full" />
          <p style={{ fontSize: "11px", color: "#9CA3AF", fontStyle: "italic", marginBottom: "8px" }}>
            Restricted System — BM Electronic Staff Only
          </p>
          <CardTitle className="text-xl">BM iPhone Store</CardTitle>
          <CardDescription>Sign in to your account</CardDescription>
        </CardHeader>
        <CardContent>
          {envMissing && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              Missing Supabase config. Env vars not set in build.
            </div>
          )}
          {error && (
            <div className="mb-4 rounded-md bg-destructive/15 p-3 text-sm text-destructive">
              <p>{error}</p>
              {networkError && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="mt-2"
                  onClick={handleRetry}
                >
                  Try again
                </Button>
              )}
            </div>
          )}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
              />
            </div>
            <div>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Password"
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              <LogIn className="mr-1 size-4" />
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link to="/signup" className="text-primary underline underline-offset-4">
                Sign up
              </Link>
            </p>
          </form>
          <div style={{
            marginTop: "24px",
            paddingTop: "16px",
            borderTop: "1px solid #E5E7EB",
            textAlign: "center",
          }}>
            <p style={{ fontSize: "11px", color: "#9CA3AF", margin: 0 }}>
              © 2026 BM Electronic. All Rights Reserved.
            </p>
            <p style={{ fontSize: "10px", color: "#D1D5DB", margin: "4px 0 0 0" }}>
              BM Store v1.0.0 — Authorized Personnel Only
            </p>
            <p style={{ fontSize: "10px", color: "#D1D5DB", margin: "4px 0 0 0" }}>
              Birendranagar, Surkhet, Nepal
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
