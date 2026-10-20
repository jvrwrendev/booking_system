import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  AlertCircle,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useAuth } from "@/hooks/useAuth";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/lib/constants";

interface LocationState {
  from?: { pathname?: string };
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const from = (location.state as LocationState)?.from?.pathname || "/dashboard";

  // Clears a stale error as soon as the user starts correcting the field that
  // produced it, so the alert never contradicts what is on screen.
  const clearError = () => setError(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success("Signed in", {
        description: `Welcome back to ${BUSINESS_NAME}.`,
      });
      navigate(from, { replace: true });
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (
    <div className="grid h-screen w-screen overflow-hidden xl:grid-cols-[6fr_4fr]">
      <div className="relative hidden h-full w-full overflow-hidden bg-primary xl:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="relative flex h-full w-full flex-col justify-between gap-12 p-12 text-primary-foreground xl:p-16">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9 rounded-lg" />
            <span className="text-sm font-semibold tracking-tight">
              Agrivet Supply Co.
            </span>
          </div>

          <div className="max-w-xl space-y-5">
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
              Manage your supply bookings and inventory with confidence.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              A unified dashboard for branches, agents, customers, and stock —
              designed for fast-moving agrivet businesses.
            </p>
          </div>

          <dl className="grid max-w-lg grid-cols-3 divide-x divide-primary-foreground/15 border-t border-primary-foreground/15 pt-6">
            <div className="pr-6">
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">
                Branches
              </dt>
              <dd className="mt-1.5 text-3xl font-semibold tabular-nums">7+</dd>
            </div>
            <div className="px-6">
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">
                Active agents
              </dt>
              <dd className="mt-1.5 text-3xl font-semibold tabular-nums">9</dd>
            </div>
            <div className="pl-6">
              <dt className="text-xs uppercase tracking-wider text-primary-foreground/60">
                Monitoring
              </dt>
              <dd className="mt-1.5 text-3xl font-semibold tabular-nums">
                24/7
              </dd>
            </div>
          </dl>
        </div>
      </div>
      <div className="flex h-full w-full items-center justify-center overflow-y-auto px-6 py-12 md:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <BrandLogo className="h-12 w-12 rounded-xl" />
            <div className="space-y-0.5">
              <div className="text-sm font-semibold tracking-tight">
                {BUSINESS_NAME}
              </div>
              <div className="text-[11px] text-muted-foreground">
                {APP_FULL_NAME}
              </div>
            </div>
          </div>

          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight">
              Welcome back
            </h1>
            <p className="text-sm text-muted-foreground">
              Sign in to continue to your dashboard.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  placeholder="admin@agrivet.ph"
                  className="h-11 pl-9 shadow-none"
                  autoComplete="email"
                  autoCapitalize="none"
                  autoCorrect="off"
                  spellCheck={false}
                  disabled={loading}
                  autoFocus
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="rounded-sm text-xs font-medium text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50"
                  onClick={() =>
                    toast.info("Password reset is unavailable", {
                      description: "Ask a Super Admin to set a new password for you.",
                    })
                  }
                  disabled={loading}
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearError();
                  }}
                  placeholder="••••••••"
                  className="h-11 pl-9 pr-10 shadow-none"
                  autoComplete="current-password"
                  disabled={loading}
                  required
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  aria-pressed={showPassword}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <label className="flex w-fit cursor-pointer select-none items-center gap-2.5">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                className="shadow-none"
                disabled={loading}
              />
              <span className="text-sm text-muted-foreground">
                Keep me signed in
              </span>
            </label>

            {error && (
              <div
                role="alert"
                aria-live="polite"
                className="flex items-start gap-2.5 rounded-md border border-destructive/30 bg-destructive/5 px-3 py-2.5 text-xs leading-relaxed text-destructive"
              >
                <AlertCircle className="mt-px h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <Button
              type="submit"
              className="h-11 w-full shadow-none"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Signing in…
                </>
              ) : (
                "Sign in"
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}