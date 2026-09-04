import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <AuthProvider>
      <TooltipProvider delayDuration={150}>
        {children}
        <Toaster position="top-right" richColors closeButton />
      </TooltipProvider>
    </AuthProvider>
  );
}