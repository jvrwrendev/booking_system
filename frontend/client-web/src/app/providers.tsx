import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import { RolesPermissionsProvider } from "@/features/roles-permissions/hooks/useRolesPermissionsStore";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <RolesPermissionsProvider>
        <TooltipProvider delayDuration={150}>
          {children}
          <Toaster position="top-right" richColors closeButton />
        </TooltipProvider>
      </RolesPermissionsProvider>
    </AuthProvider>
  );
}