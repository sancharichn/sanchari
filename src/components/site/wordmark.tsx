import Image from "next/image";
import { cn } from "@/lib/utils";

/**
 * The Sanchari mark: a motorcycle drawn from the Malayalam word സഞ്ചാരി,
 * traced from the group's logo. Decorative here — the link around it
 * carries the name.
 */
export function SanchariMark({ className, height = 36 }: { className?: string; height?: number }) {
  // The mark's artwork is 356 × 179.
  const width = Math.round((height * 356.2) / 179.1);
  return (
    <Image
      src="/brand/sanchari-mark.svg"
      alt=""
      width={width}
      height={height}
      unoptimized
      priority
      className={cn("shrink-0", className)}
    />
  );
}

/** The full lockup with "SANCHARI CHENNAI" under the bike, for larger sizes. */
export function SanchariLogo({ className, width = 220 }: { className?: string; width?: number }) {
  const height = Math.round((width * 179.1) / 356.2);
  return (
    <Image
      src="/brand/sanchari-logo.svg"
      alt="Sanchari Chennai"
      width={width}
      height={height}
      unoptimized
      className={cn("shrink-0", className)}
    />
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-3", className)}>
      <SanchariMark />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="stretch-semiwide text-lg font-extrabold tracking-tight text-mist">Sanchari</span>
        <span className="stretch-narrow text-sm font-medium text-lichen">Chennai</span>
      </span>
    </span>
  );
}
