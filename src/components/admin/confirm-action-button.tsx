"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button, type ButtonProps } from "@/components/ui/button";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import type { ActionResult } from "@/lib/action-result";

/** A button that asks before running a destructive server action. */
export function ConfirmActionButton({
  label,
  title,
  description,
  confirmLabel,
  pendingLabel = "Working…",
  action,
  redirectTo,
  variant = "destructive",
  size = "sm",
  className,
  icon,
  ariaLabel,
}: {
  label: string;
  title: string;
  description: string;
  confirmLabel: string;
  pendingLabel?: string;
  action: () => Promise<ActionResult>;
  redirectTo?: string;
  variant?: ButtonProps["variant"];
  size?: ButtonProps["size"];
  className?: string;
  /** Show this icon instead of the label; the label becomes the accessible name. */
  icon?: React.ReactNode;
  ariaLabel?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const { pending, result, setResult, run } = useActionRunner();

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setResult(null);
      }}
    >
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={icon ? "icon" : size}
          className={icon ? `size-9 ${className ?? ""}` : className}
          aria-label={icon ? (ariaLabel ?? label) : undefined}
          title={icon ? (ariaLabel ?? label) : undefined}
        >
          {icon ?? label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <FormMessage result={result && !result.ok ? result : null} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Keep it
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() =>
              void run(action, () => {
                setOpen(false);
                if (redirectTo) router.push(redirectTo);
              })
            }
          >
            {pending ? pendingLabel : confirmLabel}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
