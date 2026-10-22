import { useEffect, useRef, useState, type FormEvent } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Boxes,
  ClipboardList,
  Lock,
  Mail,
  MapPinned,
  Users,
} from "lucide-react";
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
import { isEmail } from "@/lib/validation";
import { APP_FULL_NAME, BUSINESS_NAME } from "@/lib/constants";

interface LocationState {
  from?: { pathname?: string };
}

interface FieldErrors {
  email?: string;
  password?: string;
}

/**
 * The API issues an httpOnly cookie with a server-controlled lifetime, so a
 * per-request "stay signed in" flag does not exist. The checkbox therefore
 * remembers the email address for the next visit — never the password.
 */
const REMEMBERED_EMAIL_KEY = "agrivet-remembered-email";

const CAPABILITIES = [
  { icon: ClipboardList, label: "Bookings", detail: "Branch and agent orders" },
  { icon: Boxes, label: "Inventory", detail: "Stock levels and alerts" },
  { icon: Users, label: "Customers", detail: "Accounts and purchase history" },
  { icon: MapPinned, label: "Live tracking", detail: "Field agent locations" },
];

function readRememberedEmail(): string | null {
  try {
    return localStorage.getItem(REMEMBERED_EMAIL_KEY);
  } catch {
    return null;
  }
}

export function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated, sessionExpired } = useAuth();

  const rememberedEmail = readRememberedEmail();

  const [email, setEmail] = useState(rememberedEmail ?? "");
  const [password, setPassword] = useState("");
  const [remember, setRemember] = useState(rememberedEmail !== null);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [serverError, setServerError] = useState<string | null>(null);
  const [capsLock, setCapsLock] = useState(false);
  const [loading, setLoading] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

  const from = (location.state as LocationState)?.from?.pathname || "/dashboard";

  // A live session should never land on the sign-in form — including the
  // moment right after a successful login. This is the only navigation path.
  useEffect(() => {
    if (isAuthenticated) navigate(from, { replace: true });
  }, [isAuthenticated, from, navigate]);

  const validate = (): FieldErrors => {
    const next: FieldErrors = {};
    const trimmed = email.trim();

    if (!trimmed) next.email = "Email is required.";
    else if (!isEmail(trimmed)) next.email = "Enter a valid email address.";

    if (!password) next.password = "Password is required.";

    return next;
  };

  const persistEmailPreference = (value: string) => {
    try {
      if (remember) localStorage.setItem(REMEMBERED_EMAIL_KEY, value);
      else localStorage.removeItem(REMEMBERED_EMAIL_KEY);
    } catch {
      // Blocked storage just means the preference won't persist.
    }
  };

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setServerError(null);

    const nextErrors = validate();
    if (nextErrors.email || nextErrors.password) {
      setFieldErrors(nextErrors);
      requestAnimationFrame(() => {
        formRef.current
          ?.querySelector<HTMLElement>('[aria-invalid="true"]')
          ?.focus();
      });
      return;
    }

    setFieldErrors({});
    setLoading(true);
    const trimmed = email.trim();
    const result = await login(trimmed, password);
    setLoading(false);

    if (result.success) {
      persistEmailPreference(trimmed);
      toast.success("Signed in", {
        description: `Welcome back to ${BUSINESS_NAME}.`,
      });
      // The `isAuthenticated` effect performs the redirect.
    } else {
      setServerError(result.error ?? "Login failed. Please try again.");
    }
  };

  /** Tracks Caps Lock so the password field can warn before a failed attempt. */
  const syncCapsLock = (event: React.KeyboardEvent<HTMLInputElement>) => {
    setCapsLock(event.getModifierState?.("CapsLock") ?? false);
  };

  return (
    <div className="grid h-dvh w-screen overflow-hidden xl:grid-cols-[minmax(0,7fr)_minmax(0,3fr)]">
      {/* Brand panel */}
      <aside className="relative hidden h-full w-full overflow-hidden bg-primary text-primary-foreground xl:flex xl:flex-col xl:justify-between xl:p-14 2xl:p-16">
        <div className="flex items-center gap-2.5">
          <BrandLogo className="h-9 w-9" />
          <span className="text-sm font-semibold tracking-tight">
            {BUSINESS_NAME}
          </span>
        </div>

        <div className="max-w-lg space-y-8">
          <div className="space-y-4">
            <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary-foreground/60">
              Booking &amp; Inventory
            </p>
            <h1 className="text-balance text-3xl font-semibold leading-[1.15] tracking-tight 2xl:text-4xl">
              Run your agrivet supply operation from one place.
            </h1>
            <p className="max-w-md text-sm leading-relaxed text-primary-foreground/70">
              Bookings, stock, branches and agents — in a single, dependable
              workspace built for fast-moving agrivet businesses.
            </p>
          </div>

          <ul className="grid max-w-md grid-cols-2 gap-x-8">
            {CAPABILITIES.map(({ icon: Icon, label, detail }) => (
              <li
                key={label}
                className="flex items-start gap-2.5 border-t border-primary-foreground/15 py-3"
              >
                <Icon
                  className="mt-0.5 h-4 w-4 shrink-0 text-primary-foreground/55"
                  aria-hidden
                />
                <div className="min-w-0">
                  <p className="text-sm font-medium leading-tight">{label}</p>
                  <p className="mt-0.5 text-xs leading-snug text-primary-foreground/55">
                    {detail}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-primary-foreground/15 pt-6 text-xs text-primary-foreground/55">
          <span>{BUSINESS_NAME}</span>
          <span>Booking &amp; Inventory Platform</span>
        </div>
      </aside>

      {/* Form panel */}
      <div className="flex h-full w-full items-center justify-center overflow-y-auto bg-muted/40 px-4 py-10 md:px-6 xl:px-5">
        <div className="w-full max-w-md rounded-lg border bg-card p-6 shadow-panel xl:p-7">
          <div className="mb-8 flex items-center gap-2.5">
            <BrandLogo className="h-9 w-9" />
            <div className="min-w-0 leading-tight">
              <p className="truncate text-sm font-semibold tracking-tight text-foreground">
                {BUSINESS_NAME}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {APP_FULL_NAME}
              </p>
            </div>
          </div>

          <div className="mb-6 space-y-1.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">
              Sign in
            </h2>
            <p className="text-sm text-muted-foreground">
              Use your Agrivet admin credentials to continue.
            </p>
          </div>

          {sessionExpired && !serverError && (
            <Alert variant="warning" className="mb-5">
              <AlertDescription>
                Your session expired. Sign in again to continue.
              </AlertDescription>
            </Alert>
          )}

          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-5"
            noValidate
          >
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
                    setFieldErrors((f) => ({ ...f, email: undefined }));
                    setServerError(null);
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
                  aria-invalid={!!fieldErrors.email}
                  aria-describedby={
                    fieldErrors.email ? "email-error" : undefined
                  }
                />
              </div>
              {fieldErrors.email && (
                <p
                  id="email-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {fieldErrors.email}
                </p>
              )}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password">Password</Label>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  setFieldErrors((f) => ({ ...f, password: undefined }));
                  setServerError(null);
                }}
                onKeyDown={syncCapsLock}
                onKeyUp={syncCapsLock}
                onBlur={() => setCapsLock(false)}
                placeholder="••••••••"
                className="h-10 pl-9"
                leadingIcon={<Lock className="h-4 w-4" aria-hidden />}
                autoComplete="current-password"
                disabled={loading}
                required
                aria-invalid={!!fieldErrors.password}
                aria-describedby={
                  fieldErrors.password ? "password-error" : undefined
                }
              />
              {fieldErrors.password ? (
                <p
                  id="password-error"
                  role="alert"
                  className="text-xs text-destructive"
                >
                  {fieldErrors.password}
                </p>
              ) : (
                capsLock && (
                  <p role="status" className="text-xs text-warning">
                    Caps Lock is on.
                  </p>
                )
              )}
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

            {serverError && (
              <Alert variant="destructive">
                <AlertDescription>{serverError}</AlertDescription>
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

          <div className="mt-7 border-t pt-5">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Trouble signing in? Ask your Super Admin to reset your password.
            </p>
            <p className="mt-2 text-xs tabular-nums text-muted-foreground">
              v1.0.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
