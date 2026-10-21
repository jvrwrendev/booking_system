import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RolesPermissionsProvider } from "@/features/roles-permissions/hooks/useRolesPermissionsStore";
import { NotificationsProvider } from "@/features/notifications/hooks/useNotifications";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RolesPermissionsProvider>
        <NotificationsProvider>
          <TooltipProvider delayDuration={150}>
            {children}
            <Toaster />
          </TooltipProvider>
        </NotificationsProvider>
      </RolesPermissionsProvider>
    </AuthProvider>
  );
}
