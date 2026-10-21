import { Link } from "react-router-dom";
import { ShieldOff, FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface NotFoundProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
  permission?: boolean;
  className?: string;
}

export function NotFound({
  title = "Page not found",
  message = "The page you are looking for does not exist.",
  backHref = "/",
  backLabel = "Go back",
  permission = false,
  className,
}: NotFoundProps) {
  const Icon = permission ? ShieldOff : FileQuestion;
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center rounded-lg border bg-card px-6 py-16 text-center",
        className
      )}
    >
      <Icon className="mb-3 h-10 w-10 text-muted-foreground" aria-hidden />
      <h2 className="text-lg font-semibold text-foreground">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4" variant="outline">
        <Link to={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
