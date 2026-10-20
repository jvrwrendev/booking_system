import logoUrl from "@/assets/main-logo.jpg";
import { cn } from "@/lib/utils";

interface BrandLogoProps {
  className?: string;
  alt?: string;
}

/**
 * Brand mark. The source asset is an opaque JPEG, so the wrapper always clips to
 * a rounded box — the square corners and the image's own background never bleed
 * into the surrounding surface. Size it from the call site (`h-8 w-8`, etc.).
 */
export function BrandLogo({
  className,
  alt = "Agrivet Supply Co.",
}: BrandLogoProps) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center overflow-hidden rounded-md bg-primary",
        className
      )}
    >
      <img src={logoUrl} alt={alt} className="h-full w-full object-cover" />
    </span>
  );
}
