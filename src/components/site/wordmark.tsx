import { cn } from "@/lib/utils";

/** The mark: a ridge line with a dotted trail climbing towards it. */
export function TrailMark({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 64 64" className={cn("size-8", className)}>
      <path
        d="M7 45 L23 22 L32.5 34.5 L40 26 L57 45"
        fill="none"
        stroke="#FFE600"
        strokeWidth="3.6"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <path
        d="M15 56 C24 52.5 29.5 48 32 40.5"
        fill="none"
        stroke="#FFE600"
        strokeWidth="3.2"
        strokeLinecap="round"
        strokeDasharray="0.5 6"
      />
    </svg>
  );
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <TrailMark />
      <span className="flex items-baseline gap-1.5 leading-none">
        <span className="stretch-semiwide text-lg font-extrabold tracking-tight text-mist">Sanchari</span>
        <span className="stretch-narrow text-sm font-medium text-lichen">Chennai</span>
      </span>
    </span>
  );
}
