import { useState } from "react";
import { Outlet } from "react-router-dom";
import { Sidebar } from "./Sidebar";
import { Header } from "./Header";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { usePermissions } from "@/hooks/usePermissions";
import { ShieldOff } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

export function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { can } = usePermissions();

  if (!can("dashboard.view")) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-background p-6">
        <div className="max-w-md text-center">
          <ShieldOff className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
          <h2 className="text-lg font-semibold text-foreground">
            No dashboard access
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Your account does not have permission to view the dashboard.
          </p>
          <Button asChild className="mt-4" variant="outline">
            <Link to="/login">Sign in with a different user</Link>
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 flex h-full w-full overflow-hidden bg-muted/30">
      <div className="hidden h-full shrink-0 lg:block">
        <Sidebar />
      </div>
      <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navigation</SheetTitle>
          <Sidebar onNavigate={() => setMobileOpen(false)} />
        </SheetContent>
      </Sheet>
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <Header onMenuClick={() => setMobileOpen(true)} />
        <main className="flex-1 overflow-y-auto">
          <div className="h-full w-full px-4 py-5 md:px-6 md:py-6">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
