"use client";

import { Eye, EyeOff, Globe, Trash2 } from "lucide-react";
import { deleteResponse, setResponseFeatured, setResponseHidden } from "@/actions/admin-feedback";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

/** Show on the website, hide from the scores, or delete one response. */
export function ResponseActions({
  responseId,
  featured,
  hidden,
  featureBlockedBecause,
}: {
  responseId: string;
  featured: boolean;
  hidden: boolean;
  /** Why this response can't go on the website, if it can't. */
  featureBlockedBecause: string | null;
}) {
  const { pending, result, run } = useActionRunner();

  return (
    <div className="grid gap-2">
      <div className="flex flex-wrap items-center gap-2">
        {featureBlockedBecause && !featured ? (
          <p className="mr-auto text-xs text-lichen">{featureBlockedBecause}</p>
        ) : (
          <Button
            type="button"
            size="sm"
            variant={featured ? "default" : "outline"}
            className="mr-auto"
            disabled={pending}
            aria-pressed={featured}
            onClick={() => void run(() => setResponseFeatured(responseId, !featured))}
          >
            <Globe className="size-4" aria-hidden="true" />
            {featured ? "On the website" : "Show on the website"}
          </Button>
        )}
        <Button
          type="button"
          size="sm"
          variant="ghost"
          disabled={pending}
          onClick={() => void run(() => setResponseHidden(responseId, !hidden))}
        >
          {hidden ? <Eye className="size-4" aria-hidden="true" /> : <EyeOff className="size-4" aria-hidden="true" />}
          {hidden ? "Count it again" : "Hide"}
        </Button>
        <ConfirmActionButton
          label="Delete"
          ariaLabel="Delete this response"
          icon={<Trash2 className="size-4" aria-hidden="true" />}
          title="Delete this response?"
          description="Its answers and the ideas that came from it are deleted for good. To keep it out of the scores without losing it, hide it instead."
          confirmLabel="Delete response"
          pendingLabel="Deleting…"
          action={deleteResponse.bind(null, responseId)}
          variant="ghost"
          className="text-lichen hover:text-ember"
        />
      </div>
      <FormMessage result={result} />
    </div>
  );
}
