import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, ShieldCheck } from "lucide-react";
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

/**
 * Seeded by `api/prisma/seed.ts`. The password is intentionally not surfaced
 * here — it lives in `api/.env` as SEED_ADMIN_PASSWORD and must not be baked
 * into a client bundle.
 */
const DEV_ADMIN_EMAIL =
  import.meta.env.VITE_DEV_ADMIN_EMAIL || "admin@agrivet.local";

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

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const result = await login(email, password);
    setLoading(false);
    if (result.success) {
      toast.success("Signed in", {
        description: "Welcome back to Agrivet Admin.",
      });
      navigate(from, { replace: true });
    } else {
      setError(result.error ?? "Login failed");
    }
  };

  return (    <div className="grid h-screen w-screen overflow-hidden lg:grid-cols-2">
      <div className="flex h-full w-full items-center justify-center overflow-y-auto p-6 md:p-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" />
            <div className="leading-tight">
              <div className="text-sm font-semibold">{BUSINESS_NAME}</div>
              <div className="text-[11px] text-muted-foreground">
                {APP_FULL_NAME}
              </div>
            </div>
          </div>

          <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Use your admin credentials to access the dashboard.
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email">Email</Label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@agrivet.ph"
                  className="pl-8"
                  autoComplete="email"
                  required
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <button
                  type="button"
                  className="text-xs text-muted-foreground hover:text-foreground"
                  onClick={() =>
                    toast.info("Password reset is unavailable", {
                      description: "Ask a Super Admin to set a new password for you.",
                    })
                  }
                >
                  Forgot?
                </button>
              </div>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="pl-8 pr-10"
                  autoComplete="current-password"
                  required
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>
            <label className="flex cursor-pointer items-center gap-2">
              <Checkbox
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
              />
              <span className="text-sm">Remember me</span>
            </label>

            {error && (
              <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-xs text-destructive">
                {error}
              </div>
            )}

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <div className="mt-8 rounded-lg border bg-muted/30 p-4">
            <div className="mb-2 flex items-center gap-2 text-xs font-medium text-muted-foreground">
              <ShieldCheck className="h-3.5 w-3.5" />
              Development account
            </div>
            <button
              type="button"
              onClick={() => {
                setEmail(DEV_ADMIN_EMAIL);
                setError(null);
              }}
              className="w-full rounded-md border bg-card p-2.5 text-left text-xs transition-colors hover:border-primary/40 hover:bg-primary/5"
            >
              <div className="font-medium">Seeded Super Admin</div>
              <div className="text-[11px] text-muted-foreground">
                {DEV_ADMIN_EMAIL}
              </div>
            </button>
            <p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">
              Click to fill the email. The password is the{" "}
              <code className="rounded bg-muted px-1 py-0.5">
                SEED_ADMIN_PASSWORD
              </code>{" "}
              value in <code className="rounded bg-muted px-1 py-0.5">api/.env</code>.
              Create it with <code className="rounded bg-muted px-1 py-0.5">npm run db:seed</code>{" "}
              in the api folder.
            </p>
          </div>
        </div>
      </div>
      <div className="relative hidden h-full w-full overflow-hidden bg-primary lg:block">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-30"
          style={{
            backgroundImage:
              "url('https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1600&q=80')",
          }}
        />
        <div className="relative flex h-full w-full flex-col justify-between p-12 text-primary-foreground">
          <div className="flex items-center gap-2">
            <BrandLogo className="h-10 w-10" />
            <span className="text-sm font-semibold">Agrivet Supply Co.</span>
          </div>
          <div className="max-w-md space-y-3">
            <h2 className="text-3xl font-semibold leading-tight">
              Manage your supply bookings and inventory with confidence.
            </h2>
            <p className="text-sm text-primary-foreground/80">
              A unified dashboard for branches, agents, customers, and stock —
              designed for fast-moving agrivet businesses.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-4 text-xs">
            <div>
              <div className="text-xl font-semibold">7+</div>
              <div className="text-primary-foreground/70">Branches</div>
            </div>
            <div>
              <div className="text-xl font-semibold">9</div>
              <div className="text-primary-foreground/70">Active agents</div>
            </div>
            <div>
              <div className="text-xl font-semibold">24/7</div>
              <div className="text-primary-foreground/70">Monitoring</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}