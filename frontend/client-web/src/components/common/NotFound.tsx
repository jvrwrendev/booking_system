import { Link } from "react-router-dom";
import { ShieldOff, FileQuestion } from "lucide-react";

import { Button } from "@/components/ui/button";

interface NotFoundProps {
  title?: string;
  message?: string;
  backHref?: string;
  backLabel?: string;
  permission?: boolean;
}

export function NotFound({
  title = "Page not found",
  message = "The page you are looking for does not exist.",
  backHref = "/",
  backLabel = "Go back",
  permission = false,
}: NotFoundProps) {
  const Icon = permission ? ShieldOff : FileQuestion;
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border bg-card px-6 py-16 text-center">
      <Icon className="mb-3 h-12 w-12 text-muted-foreground" />
      <h2 className="text-lg font-semibold">{title}</h2>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">{message}</p>
      <Button asChild className="mt-4" variant="outline">
        <Link to={backHref}>{backLabel}</Link>
      </Button>
    </div>
  );
}
