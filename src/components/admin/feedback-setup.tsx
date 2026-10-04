"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, Check, Copy, ExternalLink, Plus, Trash2, X } from "lucide-react";
import { saveFeedbackForm, setFeedbackOpen } from "@/actions/admin-feedback";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, NativeSelect, Textarea } from "@/components/ui/form";
import {
  EXTRA_TYPE_LABEL,
  EXTRA_TYPES,
  MAX_EXTRAS,
  MAX_OPTIONS,
  newQuestionId,
  QUESTION_SETS,
  type ExtraQuestion,
  type ExtraType,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

type Props = {
  tripId: string;
  tripTitle: string;
  tripVisible: boolean;
  responseCount: number;
  form: { isOpen: boolean; intro: string | null; questions: ExtraQuestion[] } | null;
};

/** Open or close a trip's feedback form, share its link, and edit the welcome note and extra questions. */
export function FeedbackSetup({ tripId, tripTitle, tripVisible, responseCount, form }: Props) {
  const path = `/trips/${tripId}/feedback`;
  const [origin, setOrigin] = useState("");
  useEffect(() => setOrigin(window.location.origin), []);
  const link = `${origin}${path}`;

  return (
    <div className="grid gap-10">
      <OpenPanel tripId={tripId} tripTitle={tripTitle} isOpen={Boolean(form?.isOpen)} tripVisible={tripVisible} link={link} path={path} />
      <QuestionsEditor
        tripId={tripId}
        responseCount={responseCount}
        initialIntro={form?.intro ?? ""}
        initialQuestions={form?.questions ?? []}
      />
    </div>
  );
}

function OpenPanel({
  tripId,
  tripTitle,
  isOpen,
  tripVisible,
  link,
  path,
}: {
  tripId: string;
  tripTitle: string;
  isOpen: boolean;
  tripVisible: boolean;
  link: string;
  path: string;
}) {
  const { pending, result, run } = useActionRunner();
  const [copied, setCopied] = useState(false);
  const message = `Thank you for travelling with Sanchari Chennai on ${tripTitle}! Tell us how it went, it takes a few minutes: ${link}`;

  return (
    <section aria-labelledby="fb-open-heading" className="rounded-panel border border-ridge bg-basalt p-5 sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <h2 id="fb-open-heading" className="text-lg font-bold">
              Feedback form
            </h2>
            {isOpen ? <Badge variant="solid">Open</Badge> : <Badge variant="muted">Closed</Badge>}
          </div>
          <p className="mt-1 text-sm text-lichen">
            {isOpen
              ? "Anyone with the link can answer. One response per phone or account; sending again replaces it."
              : tripVisible
                ? "Not taking answers. Open it after the trip and share the link on WhatsApp."
                : "This trip isn't visible on the site yet, so the form can't open. Set the trip's status first."}
          </p>
        </div>
        <Button
          variant={isOpen ? "outline" : "default"}
          size="sm"
          disabled={pending || (!isOpen && !tripVisible)}
          onClick={() => void run(() => setFeedbackOpen(tripId, !isOpen))}
        >
          {pending ? "Saving…" : isOpen ? "Close feedback" : "Open feedback"}
        </Button>
      </div>

      <div className="mt-5 grid gap-3">
        <label htmlFor="fb-share-link" className="text-sm font-semibold text-mist">
          Link to share
        </label>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Input id="fb-share-link" readOnly value={link || path} onFocus={(e) => e.currentTarget.select()} className="font-mono text-sm" />
          <div className="flex shrink-0 flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-11"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(link);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                } catch {
                  document.getElementById("fb-share-link")?.focus();
                }
              }}
            >
              {copied ? <Check className="size-4" aria-hidden="true" /> : <Copy className="size-4" aria-hidden="true" />}
              {copied ? "Copied" : "Copy"}
            </Button>
            <a
              href={`https://wa.me/?text=${encodeURIComponent(message)}`}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonVariants({ variant: "outline", size: "sm", className: "h-11" })}
            >
              Share on WhatsApp
            </a>
            <a href={path} target="_blank" rel="noopener" className={buttonVariants({ variant: "ghost", size: "sm", className: "h-11" })}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Preview
            </a>
          </div>
        </div>
        <span className="sr-only" aria-live="polite">
          {copied ? "Link copied" : ""}
        </span>
        <FormMessage result={result} />
      </div>
    </section>
  );
}

type Draft = ExtraQuestion;

function QuestionsEditor({
  tripId,
  responseCount,
  initialIntro,
  initialQuestions,
}: {
  tripId: string;
  responseCount: number;
  initialIntro: string;
  initialQuestions: ExtraQuestion[];
}) {
  const { pending, result, setResult, run, fieldErrors } = useActionRunner();
  const [intro, setIntro] = useState(initialIntro);
  const [questions, setQuestions] = useState<Draft[]>(initialQuestions);
  const [note, setNote] = useState<string | null>(null);

  const dirty = useMemo(
    () => intro !== initialIntro || JSON.stringify(questions) !== JSON.stringify(initialQuestions),
    [intro, questions, initialIntro, initialQuestions],
  );

  const update = (index: number, change: Partial<Draft>) =>
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...change } : q)));

  const move = (index: number, by: -1 | 1) =>
    setQuestions((qs) => {
      const target = index + by;
      if (target < 0 || target >= qs.length) return qs;
      const next = [...qs];
      [next[index], next[target]] = [next[target], next[index]];
      return next;
    });

  const add = (drafts: Array<Omit<Draft, "id">>) => {
    const room = MAX_EXTRAS - questions.length;
    const added = drafts.slice(0, room).map((d) => ({ ...d, options: [...d.options], id: newQuestionId() }));
    setQuestions((qs) => [...qs, ...added]);
    setNote(
      added.length < drafts.length
        ? `Only ${added.length} of ${drafts.length} fitted: a form can have up to ${MAX_EXTRAS} extra questions.`
        : null,
    );
    setResult(null);
  };

  const err = (key: string) => fieldErrors[key];

  return (
    <form
      noValidate
      className="grid max-w-3xl gap-8"
      onSubmit={(e) => {
        e.preventDefault();
        void run(
          () => saveFeedbackForm(tripId, { intro, questions }),
          (saved) => {
            // Take the tidied version the server stored (trimmed text, empty options dropped).
            if (saved.ok && saved.data) {
              setIntro((saved.data.intro as string | null) ?? "");
              setQuestions(saved.data.questions as Draft[]);
            }
          },
        );
      }}
    >
      <Field
        label="Welcome note"
        htmlFor="fb-intro"
        hint="Optional. Shown at the top of the form, for example: Thank you for celebrating Onam with us at Kumizhi Lake!"
        error={err("intro")}
      >
        <Textarea
          id="fb-intro"
          rows={3}
          className="min-h-20"
          maxLength={400}
          value={intro}
          onChange={(e) => setIntro(e.target.value)}
          aria-invalid={Boolean(err("intro"))}
          aria-describedby={err("intro") ? "fb-intro-error" : "fb-intro-hint"}
        />
      </Field>

      <fieldset className="grid gap-5">
        <legend className="stretch-semiwide mb-1 text-xl font-bold">Questions for this trip</legend>
        <p className="measure -mt-2 text-sm text-lichen">
          Every form asks the standard questions: overall stars; venue, food, travel, planning and value; would they come
          again; what they loved; their ideas; and where to go next. Add questions that only this trip needs.
        </p>
        {responseCount > 0 ? (
          <p className="measure rounded-[10px] border border-dashed border-lichen/60 px-4 py-3 text-sm text-mist">
            {responseCount} {responseCount === 1 ? "person has" : "people have"} already answered. Removing a question hides
            its answers, and changing its type can make earlier answers stop counting.
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          {QUESTION_SETS.map((set) => (
            <Button
              key={set.id}
              type="button"
              variant="outline"
              size="sm"
              onClick={() => add(set.questions)}
              disabled={questions.length >= MAX_EXTRAS}
              title={set.description}
            >
              <Plus className="size-4" aria-hidden="true" />
              {set.label} questions
            </Button>
          ))}
        </div>
        {note ? <p className="text-sm text-lichen">{note}</p> : null}
        {err("questions") ? <p className="text-sm text-ember">{err("questions")}</p> : null}

        {questions.length === 0 ? (
          <p className="text-sm text-mist">No extra questions. The form goes straight from the trip to your ideas.</p>
        ) : (
          <ol className="grid gap-4">
            {questions.map((q, i) => {
              const base = `fbq-${q.id}`;
              const key = (field: string) => `questions.${i}.${field}`;
              return (
                <li key={q.id} className="grid gap-4 rounded-[14px] border border-ridge p-4 sm:p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="stretch-narrow text-sm font-semibold tabular-nums text-lichen">Question {i + 1}</p>
                    <div className="flex gap-1">
                      <Button type="button" size="icon" variant="ghost" className="size-9" onClick={() => move(i, -1)} disabled={i === 0} aria-label={`Move question ${i + 1} up`}>
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9"
                        onClick={() => move(i, 1)}
                        disabled={i === questions.length - 1}
                        aria-label={`Move question ${i + 1} down`}
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        type="button"
                        size="icon"
                        variant="ghost"
                        className="size-9 text-ember"
                        onClick={() => setQuestions((qs) => qs.filter((_, j) => j !== i))}
                        aria-label={`Remove question ${i + 1}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_16rem]">
                    <Field label="Question" htmlFor={`${base}-label`} error={err(key("label"))}>
                      <Input
                        id={`${base}-label`}
                        maxLength={160}
                        value={q.label}
                        onChange={(e) => update(i, { label: e.target.value })}
                        aria-invalid={Boolean(err(key("label")))}
                        aria-describedby={err(key("label")) ? `${base}-label-error` : undefined}
                      />
                    </Field>
                    <Field label="Answer type" htmlFor={`${base}-type`}>
                      <NativeSelect
                        id={`${base}-type`}
                        value={q.type}
                        onChange={(e) => {
                          const type = e.target.value as ExtraType;
                          update(i, { type, options: type === "choice" ? (q.options.length ? q.options : ["", ""]) : [] });
                        }}
                      >
                        {EXTRA_TYPES.map((t) => (
                          <option key={t} value={t}>
                            {EXTRA_TYPE_LABEL[t]}
                          </option>
                        ))}
                      </NativeSelect>
                    </Field>
                  </div>

                  {q.type === "choice" ? (
                    <fieldset className="grid gap-2" aria-describedby={err(key("options")) ? `${base}-options-error` : undefined}>
                      <legend className="mb-1 text-sm font-semibold text-mist">Options</legend>
                      {q.options.map((option, j) => (
                        <div key={j} className="flex gap-2">
                          <Input
                            aria-label={`Option ${j + 1}`}
                            maxLength={60}
                            value={option}
                            onChange={(e) => update(i, { options: q.options.map((o, k) => (k === j ? e.target.value : o)) })}
                          />
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            className="size-11 shrink-0 text-lichen hover:text-ember"
                            onClick={() => update(i, { options: q.options.filter((_, k) => k !== j) })}
                            aria-label={`Remove option ${j + 1}`}
                          >
                            <X className="size-4" aria-hidden="true" />
                          </Button>
                        </div>
                      ))}
                      <div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => update(i, { options: [...q.options, ""] })}
                          disabled={q.options.length >= MAX_OPTIONS}
                        >
                          <Plus className="size-4" aria-hidden="true" />
                          Add an option
                        </Button>
                      </div>
                      {err(key("options")) ? (
                        <p id={`${base}-options-error`} className="text-sm text-ember">
                          {err(key("options"))}
                        </p>
                      ) : null}
                    </fieldset>
                  ) : null}

                  <Field label="Hint" htmlFor={`${base}-help`} hint="Optional. A line under the question." error={err(key("help"))}>
                    <Input
                      id={`${base}-help`}
                      maxLength={200}
                      value={q.help}
                      onChange={(e) => update(i, { help: e.target.value })}
                      aria-describedby={`${base}-help-${err(key("help")) ? "error" : "hint"}`}
                    />
                  </Field>

                  <label className="flex w-fit cursor-pointer items-center gap-2.5 text-sm font-semibold text-mist">
                    <input
                      type="checkbox"
                      checked={q.required}
                      onChange={(e) => update(i, { required: e.target.checked })}
                      className="size-4 accent-[#FFE600]"
                    />
                    Required
                  </label>
                </li>
              );
            })}
          </ol>
        )}

        <div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => add([{ type: "stars", label: "", help: "", options: [], required: false }])}
            disabled={questions.length >= MAX_EXTRAS}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add a question
          </Button>
        </div>
      </fieldset>

      <div className="flex flex-wrap items-center gap-4 border-t border-ridge pt-6">
        <Button type="submit" disabled={pending}>
          {pending ? "Saving…" : "Save form"}
        </Button>
        {dirty && !pending ? <span className={cn("text-sm text-lichen")}>Unsaved changes</span> : null}
        <FormMessage result={result} />
      </div>
    </form>
  );
}
