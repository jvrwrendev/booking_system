import { useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Lock, Mail, Package, Users, Building2 } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Spinner } from "@/components/ui/spinner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { BrandLogo } from "@/components/common/BrandLogo";
import { PasswordInput } from "@/components/common/PasswordInput";
import { useAuth } from "@/hooks/useAuth";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/lib/constants";

interface LocationState {
  from?: { pathname?: string };
}

const HIGHLIGHTS = [
  { icon: Package, label: "Products & pricing" },
  { icon: Users, label: "Customers & agents" },
  { icon: Building2, label: "Branch inventory" },
];

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login } = useAuth();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
    <div className="grid h-dvh w-screen overflow-hidden xl:grid-cols-[6fr_4fr]">
      <div className="relative hidden h-full w-full overflow-hidden bg-primary xl:block">
        <div className="relative flex h-full w-full flex-col justify-between gap-12 p-12 text-primary-foreground xl:p-16">
          <div className="flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" />
            <span className="text-sm font-semibold tracking-tight">
              Agrivet Supply Co.
            </span>
          </div>

          <div className="max-w-xl space-y-6">
            <h2 className="text-4xl font-semibold leading-[1.1] tracking-tight text-balance">
              Manage your supply bookings and inventory with confidence.
            </h2>
            <p className="max-w-lg text-sm leading-relaxed text-primary-foreground/75">
              A unified dashboard for branches, agents, customers, and stock —
              designed for fast-moving agrivet businesses.
            </p>
            <ul className="grid max-w-lg gap-3 sm:grid-cols-3">
              {HIGHLIGHTS.map(({ icon: Icon, label }) => (
                <li
                  key={label}
                  className="flex items-center gap-2 border-t border-primary-foreground/20 pt-3 text-sm text-primary-foreground/80"
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {label}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex items-center gap-2 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/60">
            <span>Agrivet Supply Co.</span>
            <span aria-hidden>•</span>
            <span>Booking &amp; Inventory Platform</span>
          </div>
        </div>
      </div>

      <div className="flex h-full w-full items-center justify-center overflow-y-auto px-6 py-12 md:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex flex-col items-center gap-3 text-center">
            <BrandLogo className="h-12 w-12" />
            <div className="space-y-0.5">
              <div className="text-sm font-semibold tracking-tight text-foreground">
                {BUSINESS_NAME}
              </div>
              <div className="text-xs text-muted-foreground">{APP_FULL_NAME}</div>
            </div>
          </div>

          <div className="mb-8 space-y-1.5">
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">
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
                <Mail
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                  aria-hidden
                />
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearError();
                  }}
                  placeholder="admin@agrivet.ph"
                  className="h-10 pl-9"
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
                <Button
                  type="button"
                  variant="link"
                  size="sm"
                  className="h-auto px-0 text-xs"
                  onClick={() =>
                    toast.info("Password reset is unavailable", {
                      description:
                        "Ask a Super Admin to set a new password for you.",
                    })
                  }
                  disabled={loading}
                >
                  Forgot?
                </Button>
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  clearError();
                }}
                placeholder="••••••••"
                className="h-10 pl-9"
                leadingIcon={
                  <Lock className="h-4 w-4" aria-hidden />
                }
                autoComplete="current-password"
                disabled={loading}
                required
              />
            </div>

            <div className="flex items-center gap-2.5">
              <Checkbox
                id="remember"
                checked={remember}
                onCheckedChange={(v) => setRemember(v === true)}
                disabled={loading}
              />
              <Label
                htmlFor="remember"
                className="cursor-pointer font-normal text-muted-foreground"
              >
                Keep me signed in
              </Label>
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              className="h-10 w-full"
              disabled={loading}
              aria-busy={loading}
            >
              {loading ? (
                <>
                  <Spinner className="h-4 w-4" label="Signing in" />
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
