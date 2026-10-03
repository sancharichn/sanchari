"use client";

import { useState } from "react";
import { cancelRegistration } from "@/actions/member";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";
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

export function CancelRegistrationButton({ tripId, tripTitle }: { tripId: string; tripTitle: string }) {
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
        <Button variant="destructive" size="sm" className="w-full">
          Cancel my registration
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Cancel your registration?</DialogTitle>
          <DialogDescription>
            You&apos;ll lose your place on {tripTitle}. If people are on the waitlist, the next one in line gets your
            seat. You can register again later if seats are still open.
          </DialogDescription>
        </DialogHeader>
        <FormMessage result={result} />
        <DialogFooter>
          <DialogClose asChild>
            <Button type="button" variant="ghost">
              Keep my place
            </Button>
          </DialogClose>
          <Button
            variant="destructive"
            disabled={pending}
            onClick={() => void run(() => cancelRegistration(tripId), () => setOpen(false))}
          >
            {pending ? "Cancelling…" : "Cancel registration"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
