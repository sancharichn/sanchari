"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { addExpense } from "@/actions/admin";
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
import { Field, Input, NativeSelect } from "@/components/ui/form";
import { EXPENSE_CATEGORIES } from "@/lib/validation";

export function AddExpenseDialog({
  tripId,
  payers,
  defaultPayerId,
}: {
  tripId: string;
  payers: Array<{ id: string; label: string }>;
  defaultPayerId: string;
}) {
  const blank = { title: "", category: "Transport", amount: "", paidById: defaultPayerId, receiptUrl: "" };
  const [open, setOpen] = useState(false);
  const [values, setValues] = useState(blank);
  const { pending, result, setResult, run, fieldErrors } = useActionRunner();

  const set = (key: keyof typeof values) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setValues((v) => ({ ...v, [key]: e.target.value }));
  const aria = (id: string, key: string, hint = false) => ({
    "aria-invalid": Boolean(fieldErrors[key]),
    "aria-describedby": fieldErrors[key] ? `${id}-error` : hint ? `${id}-hint` : undefined,
  });

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) {
          setResult(null);
          setValues(blank);
        }
      }}
    >
      <DialogTrigger asChild>
        <Button size="sm">
          <Plus className="size-4" aria-hidden="true" />
          Add expense
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add an expense</DialogTitle>
          <DialogDescription>A shared cost for this trip, and who paid for it.</DialogDescription>
        </DialogHeader>
        <form
          noValidate
          className="grid gap-5"
          onSubmit={(e) => {
            e.preventDefault();
            void run(
              () => addExpense(tripId, values),
              () => setValues({ ...blank, paidById: values.paidById, category: values.category }),
            );
          }}
        >
          <Field label="What for" htmlFor="exp-title" hint="For example: Bus hire, Chennai to Kolli Hills" error={fieldErrors.title}>
            <Input id="exp-title" value={values.title} onChange={set("title")} {...aria("exp-title", "title", true)} />
          </Field>
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label="Category" htmlFor="exp-category" error={fieldErrors.category}>
              <NativeSelect id="exp-category" value={values.category} onChange={set("category")}>
                {EXPENSE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </NativeSelect>
            </Field>
            <Field label="Amount (₹)" htmlFor="exp-amount" error={fieldErrors.amount}>
              <Input id="exp-amount" inputMode="decimal" value={values.amount} onChange={set("amount")} {...aria("exp-amount", "amount")} />
            </Field>
          </div>
          <Field label="Paid by" htmlFor="exp-payer" error={fieldErrors.paidById}>
            <NativeSelect id="exp-payer" value={values.paidById} onChange={set("paidById")} {...aria("exp-payer", "paidById")}>
              {payers.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.label}
                </option>
              ))}
            </NativeSelect>
          </Field>
          <Field label="Receipt link" htmlFor="exp-receipt" hint="Optional: a Drive or photo link." error={fieldErrors.receiptUrl}>
            <Input
              id="exp-receipt"
              type="url"
              inputMode="url"
              placeholder="https://"
              value={values.receiptUrl}
              onChange={set("receiptUrl")}
              {...aria("exp-receipt", "receiptUrl", true)}
            />
          </Field>
          <FormMessage result={result} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost">
                Close
              </Button>
            </DialogClose>
            <Button type="submit" disabled={pending}>
              {pending ? "Adding…" : "Add expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
