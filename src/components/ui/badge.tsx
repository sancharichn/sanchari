import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-semibold",
  {
    variants: {
      variant: {
        outline: "border-ridge text-mist",
        signal: "border-signal text-signal",
        solid: "border-signal bg-signal text-night",
        muted: "border-ridge text-lichen",
        dashed: "border-dashed border-lichen/60 text-lichen",
        danger: "border-ember/60 text-ember",
      },
    },
    defaultVariants: { variant: "outline" },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
