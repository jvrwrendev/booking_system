import { Navigate, useLocation, Link } from "react-router-dom";
import type { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { usePermissions } from "@/hooks/usePermissions";
import type { Permission } from "@/lib/permissions";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
}

export function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <>{children}</>;
}

interface PermissionRouteProps extends ProtectedRouteProps {
  permission?: Permission;
  permissions?: Permission[];
  mode?: "any" | "all";
}

export function PermissionRoute({
  children,
  permission,
  permissions,
  mode = "any",
}: PermissionRouteProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const { can, canAny, canAll } = usePermissions();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-muted border-t-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  let allowed = true;
  if (permission) allowed = can(permission);
  if (permissions && permissions.length > 0) {
    allowed = mode === "all" ? canAll(permissions) : canAny(permissions);
  }

  if (!allowed) {
    return <AccessDenied />;
  }

  return <>{children}</>;
}

function AccessDenied() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldOff className="mb-3 h-10 w-10 text-muted-foreground" />
      <h2 className="text-lg font-semibold">Access denied</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        You do not have the required permissions to view this page. Please
        contact your administrator if you believe this is a mistake.
      </p>
      <Button asChild className="mt-5" variant="outline">
        <Link to="/dashboard">Return to dashboard</Link>
      </Button>
    </div>
  );
}