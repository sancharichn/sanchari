"use client";

import Link from "next/link";
import { useMemo, useRef, useState, type ReactNode } from "react";
import { ArrowLeft, ArrowRight, Send, Star } from "lucide-react";
import { submitTripFeedback } from "@/actions/feedback";
import { Button, buttonVariants } from "@/components/ui/button";
import { Field, Input, Textarea } from "@/components/ui/form";
import type { ActionResult } from "@/lib/action-result";
import {
  ASPECTS,
  buildResponseSchema,
  COME_AGAIN,
  NOT_APPLICABLE_LABEL,
  OVERALL_WORDS,
  SCALE,
  stepForField,
  type AspectAnswer,
  type AspectId,
  type ComeAgainValue,
  type ExtraQuestion,
} from "@/lib/feedback";
import { cn } from "@/lib/utils";

type Values = {
  anonymous: boolean;
  name: string;
  whatsapp: string;
  groupSize: string;
  overall: number;
  ratings: Record<AspectId, AspectAnswer | "">;
  comeAgain: ComeAgainValue | "";
  extras: Record<string, string | number | null>;
  loved: string;
  leaderIdea: string;
  nextPlace: string;
  shareOk: boolean;
};

type Errors = Record<string, string>;
type Step = 1 | 2 | 3 | 4;

const STEP_TITLE: Record<Step, string> = { 1: "About you", 2: "The trip", 3: "Activities", 4: "Your ideas" };

const NETWORK_ERROR: ActionResult = { ok: false, message: "That didn't go through. Check your connection and try again." };

/** DOM id for an answer, so errors can move focus to it. */
const domId = (key: string) => `fb-${key.replace(/[^a-zA-Z0-9]/g, "-")}`;

export type TripFeedbackFormProps = {
  tripId: string;
  tripHref: string;
  extras: ExtraQuestion[];
  token: string;
  defaultName: string;
  signedIn: boolean;
  preview: boolean;
};

/** The four-step trip feedback form, ending on the "Nanni!" screen. */
export function TripFeedbackForm({ tripId, tripHref, extras, token, defaultName, signedIn, preview }: TripFeedbackFormProps) {
  const steps = useMemo<Step[]>(() => (extras.length > 0 ? [1, 2, 3, 4] : [1, 2, 4]), [extras.length]);
  const schema = useMemo(() => buildResponseSchema(extras), [extras]);

  const [values, setValues] = useState<Values>(() => ({
    anonymous: false,
    name: defaultName,
    whatsapp: "",
    groupSize: "",
    overall: 0,
    ratings: { venue: "", food: "", travel: "", planning: "", value: "" },
    comeAgain: "",
    extras: Object.fromEntries(extras.map((q) => [q.id, null])),
    loved: "",
    leaderIdea: "",
    nextPlace: "",
    shareOk: false,
  }));
  const [index, setIndex] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [result, setResult] = useState<ActionResult | null>(null);
  const [pending, setPending] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const headingRef = useRef<HTMLHeadingElement>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const step = steps[index];
  const isLast = index === steps.length - 1;

  /** Back to the top of the form; a jump instead of a glide for people who prefer less motion. */
  function scrollToTop() {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    topRef.current?.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  }

  function set<K extends keyof Values>(key: K, value: Values[K]) {
    setValues((v) => ({ ...v, [key]: value }));
  }

  function clearError(key: string) {
    setErrors((e) => {
      if (!(key in e)) return e;
      const next = { ...e };
      delete next[key];
      return next;
    });
  }

  function validate(): Errors {
    const parsed = schema.safeParse(values);
    if (parsed.success) return {};
    const found: Errors = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path.join(".");
      if (key && !found[key]) found[key] = issue.message;
    }
    return found;
  }

  function goTo(nextIndex: number, focusKey?: string) {
    setIndex(nextIndex);
    requestAnimationFrame(() => {
      scrollToTop();
      const target = focusKey ? document.getElementById(domId(focusKey)) : headingRef.current;
      target?.focus({ preventScroll: true });
    });
  }

  function next() {
    const stepErrors = Object.fromEntries(Object.entries(validate()).filter(([key]) => stepForField(key) === step));
    setErrors(stepErrors);
    const first = Object.keys(stepErrors)[0];
    if (first) {
      document.getElementById(domId(first))?.focus();
      return;
    }
    goTo(index + 1);
  }

  async function send() {
    const found = validate();
    if (Object.keys(found).length > 0) {
      showErrors(found);
      return;
    }
    setPending(true);
    try {
      const response = await submitTripFeedback(tripId, { token, website: honeypot, answers: values });
      setResult(response);
      if (!response.ok && response.fieldErrors) showErrors(response.fieldErrors);
      if (response.ok) requestAnimationFrame(scrollToTop);
    } catch {
      setResult(NETWORK_ERROR);
    } finally {
      setPending(false);
    }
  }

  function showErrors(found: Errors) {
    setErrors(found);
    const keys = Object.keys(found);
    if (keys.length === 0) return;
    const earliest = keys.reduce((a, b) => (stepForField(b) < stepForField(a) ? b : a));
    const target = steps.indexOf(stepForField(earliest));
    goTo(target === -1 ? 0 : target, earliest);
  }

  if (result?.ok) {
    return (
      <div ref={topRef} className="scroll-mt-24">
        <ThankYou
          replaced={Boolean(result.data?.replaced)}
          tripHref={tripHref}
          onEdit={() => {
            setResult(null);
            goTo(0);
          }}
        />
      </div>
    );
  }

  return (
    <div ref={topRef} className="scroll-mt-24">
      <Progress steps={steps} index={index} />

      <form
        noValidate
        className="mt-6 rounded-panel border border-ridge bg-basalt p-5 sm:p-8"
        onSubmit={(e) => {
          e.preventDefault();
          if (isLast) void send();
          else next();
        }}
      >
        {/* Left empty by people; bots fill it in. */}
        <div aria-hidden="true" className="absolute -left-[10000px] top-auto size-px overflow-hidden">
          <label htmlFor="fb-website">Website</label>
          <input
            id="fb-website"
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={honeypot}
            onChange={(e) => setHoneypot(e.target.value)}
          />
        </div>

        <h2 ref={headingRef} tabIndex={-1} className="stretch-semiwide text-2xl font-bold focus:outline-none">
          {STEP_TITLE[step]}
        </h2>

        {step === 1 ? (
          <div className="mt-6 grid gap-6">
            <AnonymousSwitch
              checked={values.anonymous}
              onChange={(on) => {
                set("anonymous", on);
                clearError("name");
                clearError("whatsapp");
              }}
            />

            {!values.anonymous ? (
              <>
                <Field label="Your name" htmlFor={domId("name")} error={errors.name}>
                  <Input
                    id={domId("name")}
                    autoComplete="name"
                    maxLength={80}
                    value={values.name}
                    onChange={(e) => {
                      set("name", e.target.value);
                      clearError("name");
                    }}
                    aria-invalid={Boolean(errors.name)}
                    aria-describedby={errors.name ? `${domId("name")}-error` : undefined}
                  />
                </Field>
                <Field
                  label="WhatsApp number"
                  htmlFor={domId("whatsapp")}
                  hint="Optional. Only organisers see it, in case they want to follow up."
                  error={errors.whatsapp}
                >
                  <Input
                    id={domId("whatsapp")}
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    maxLength={24}
                    placeholder="98765 43210"
                    value={values.whatsapp}
                    onChange={(e) => {
                      set("whatsapp", e.target.value);
                      clearError("whatsapp");
                    }}
                    aria-invalid={Boolean(errors.whatsapp)}
                    aria-describedby={`${domId("whatsapp")}-${errors.whatsapp ? "error" : "hint"}`}
                  />
                </Field>
              </>
            ) : null}

            <Field
              label="How many of you came, including you?"
              htmlFor={domId("groupSize")}
              hint="Optional. Count your family or friends who came with you."
              error={errors.groupSize}
            >
              <Input
                id={domId("groupSize")}
                type="number"
                inputMode="numeric"
                min={1}
                max={50}
                className="max-w-32"
                value={values.groupSize}
                onChange={(e) => {
                  set("groupSize", e.target.value);
                  clearError("groupSize");
                }}
                aria-invalid={Boolean(errors.groupSize)}
                aria-describedby={`${domId("groupSize")}-${errors.groupSize ? "error" : "hint"}`}
              />
            </Field>

            {signedIn ? (
              <p className="text-sm text-lichen">
                You&apos;re signed in, so if you had a seat on this trip, your answers are marked as coming from a
                traveller.
              </p>
            ) : null}
          </div>
        ) : null}

        {step === 2 ? (
          <div className="mt-6 grid gap-8">
            <StarField
              id={domId("overall")}
              legend="Overall, how was the trip?"
              value={values.overall}
              error={errors.overall}
              onChange={(n) => {
                set("overall", n);
                clearError("overall");
              }}
            />

            <div className="grid gap-5">
              <p className="font-semibold text-mist">How was each part?</p>
              {ASPECTS.map((aspect) => {
                const key = `ratings.${aspect.id}`;
                return (
                  <ChoiceField
                    key={aspect.id}
                    id={domId(key)}
                    legend={aspect.label}
                    name={key}
                    value={values.ratings[aspect.id]}
                    error={errors[key]}
                    options={[
                      ...SCALE.map((s) => ({ value: s.value, label: s.label, mark: s.mark })),
                      { value: "NA", label: NOT_APPLICABLE_LABEL },
                    ]}
                    onChange={(answer) => {
                      setValues((v) => ({ ...v, ratings: { ...v.ratings, [aspect.id]: answer as AspectAnswer } }));
                      clearError(key);
                    }}
                    compact
                  />
                );
              })}
            </div>

            <ChoiceField
              id={domId("comeAgain")}
              legend="Would you travel with Sanchari again?"
              name="comeAgain"
              value={values.comeAgain}
              error={errors.comeAgain}
              options={COME_AGAIN.map((c) => ({ value: c.value, label: c.label }))}
              onChange={(answer) => {
                set("comeAgain", answer as ComeAgainValue);
                clearError("comeAgain");
              }}
            />
          </div>
        ) : null}

        {step === 3 ? (
          <div className="mt-6 grid gap-8">
            {extras.map((q) => (
              <ExtraAnswer
                key={q.id}
                question={q}
                value={values.extras[q.id] ?? null}
                error={errors[`extras.${q.id}`]}
                onChange={(answer) => {
                  setValues((v) => ({ ...v, extras: { ...v.extras, [q.id]: answer } }));
                  clearError(`extras.${q.id}`);
                }}
              />
            ))}
          </div>
        ) : null}

        {step === 4 ? (
          <div className="mt-6 grid gap-6">
            <Field
              label="What did you love most?"
              htmlFor={domId("loved")}
              hint="Optional. If you allow it below, we may quote this on the website."
              error={errors.loved}
            >
              <Textarea
                id={domId("loved")}
                rows={3}
                maxLength={1000}
                value={values.loved}
                onChange={(e) => {
                  set("loved", e.target.value);
                  clearError("loved");
                }}
                aria-invalid={Boolean(errors.loved)}
                aria-describedby={`${domId("loved")}-${errors.loved ? "error" : "hint"}`}
              />
            </Field>

            <Field
              label="If you were leading Sanchari Chennai, what would you introduce, change or improve?"
              htmlFor={domId("leaderIdea")}
              hint="Put yourself in the organisers' shoes. Every idea is read and tracked."
              error={errors.leaderIdea}
            >
              <Textarea
                id={domId("leaderIdea")}
                rows={5}
                maxLength={1500}
                value={values.leaderIdea}
                onChange={(e) => {
                  set("leaderIdea", e.target.value);
                  clearError("leaderIdea");
                }}
                aria-invalid={Boolean(errors.leaderIdea)}
                aria-describedby={`${domId("leaderIdea")}-${errors.leaderIdea ? "error" : "hint"}`}
              />
            </Field>

            <Field label="Where should we go next?" htmlFor={domId("nextPlace")} hint="Optional." error={errors.nextPlace}>
              <Input
                id={domId("nextPlace")}
                maxLength={120}
                value={values.nextPlace}
                onChange={(e) => {
                  set("nextPlace", e.target.value);
                  clearError("nextPlace");
                }}
                aria-invalid={Boolean(errors.nextPlace)}
                aria-describedby={`${domId("nextPlace")}-${errors.nextPlace ? "error" : "hint"}`}
              />
            </Field>

            <label className="flex cursor-pointer items-start gap-3 rounded-[10px] border border-ridge p-4 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal">
              <input
                type="checkbox"
                checked={values.shareOk}
                onChange={(e) => set("shareOk", e.target.checked)}
                className="mt-0.5 size-5 shrink-0 accent-[#E6D65C]"
              />
              <span>
                <span className="block font-semibold text-mist">Sanchari may quote what I loved on the website</span>
                <span className="mt-0.5 block text-sm text-lichen">
                  {values.anonymous
                    ? "It would appear without your name."
                    : "It would appear with your first name only."}{" "}
                  Organisers choose which ones to show.
                </span>
              </span>
            </label>
          </div>
        ) : null}

        {result && !result.ok ? (
          <p role="alert" className="mt-6 rounded-[10px] border border-ember/50 bg-ember/10 px-4 py-3 text-sm text-mist">
            {result.message}
          </p>
        ) : null}

        {preview && isLast ? (
          <p className="mt-6 rounded-[10px] border border-dashed border-lichen/60 px-4 py-3 text-sm text-mist">
            Preview only. Open the form from the trip&apos;s Feedback tab to start taking answers.
          </p>
        ) : null}

        <div className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-ridge pt-6">
          {index > 0 ? (
            <Button type="button" variant="outline" onClick={() => goTo(index - 1)}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Back
            </Button>
          ) : (
            <span />
          )}
          {isLast ? (
            <Button type="submit" disabled={pending || preview}>
              <Send className="size-4" aria-hidden="true" />
              {pending ? "Sending…" : "Send feedback"}
            </Button>
          ) : (
            <Button type="submit">
              Next
              <ArrowRight className="size-4" aria-hidden="true" />
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}

/* ----------------------------------------------------------------------------
 * Pieces
 * ------------------------------------------------------------------------- */

function Progress({ steps, index }: { steps: Step[]; index: number }) {
  const last = steps.length - 1;
  return (
    <div>
      <p className="text-sm text-lichen">
        Step <span className="tabular-nums text-mist">{index + 1}</span> of{" "}
        <span className="tabular-nums">{steps.length}</span>
      </p>
      <div className="relative mt-3 h-14">
        <span aria-hidden="true" className="absolute inset-x-0 top-[0.6875rem] h-px bg-ridge" />
        <span
          aria-hidden="true"
          className="absolute left-0 top-[0.6875rem] h-px bg-signal transition-[width] duration-500 motion-reduce:transition-none"
          style={{ width: last > 0 ? `${(index / last) * 100}%` : "0%" }}
        />
        <ol>
          {steps.map((step, i) => (
            <li
              key={step}
              style={{ left: last > 0 ? `${(i / last) * 100}%` : "0%" }}
              className={cn(
                "absolute top-0 flex flex-col gap-2 whitespace-nowrap",
                i === 0 ? "items-start" : i === last ? "-translate-x-full items-end" : "-translate-x-1/2 items-center",
              )}
              aria-current={i === index ? "step" : undefined}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "relative z-10 block size-[1.375rem] rounded-full border-2",
                  i < index ? "border-signal bg-signal" : i === index ? "border-signal bg-night" : "border-ridge bg-night",
                )}
              />
              <span className={cn("text-xs font-semibold sm:text-sm", i === index ? "text-mist" : "text-lichen")}>
                {STEP_TITLE[step]}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}

function AnonymousSwitch({ checked, onChange }: { checked: boolean; onChange: (on: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 rounded-[10px] border border-ridge p-4">
      <div>
        <p id="fb-anon-label" className="font-semibold text-mist">
          Send anonymously
        </p>
        <p id="fb-anon-hint" className="mt-0.5 text-sm text-lichen">
          Your name, number and account aren&apos;t saved with your answers.
        </p>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-labelledby="fb-anon-label"
        aria-describedby="fb-anon-hint"
        onClick={() => onChange(!checked)}
        className={cn(
          "relative mt-0.5 inline-flex h-7 w-12 shrink-0 items-center rounded-full border transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-signal",
          checked ? "border-signal bg-signal" : "border-ridge bg-night",
        )}
      >
        <span
          aria-hidden="true"
          className={cn(
            "inline-block size-5 rounded-full transition-transform motion-reduce:transition-none",
            checked ? "translate-x-6 bg-night" : "translate-x-1 bg-lichen",
          )}
        />
      </button>
    </div>
  );
}

function ErrorText({ id, error }: { id: string; error?: string }) {
  return error ? (
    <p id={`${id}-error`} className="mt-2 text-sm text-ember">
      {error}
    </p>
  ) : null;
}

function StarField({
  id,
  legend,
  value,
  error,
  onChange,
  hint,
}: {
  id: string;
  legend: ReactNode;
  value: number;
  error?: string;
  onChange: (n: number) => void;
  hint?: string;
}) {
  const [hover, setHover] = useState(0);
  const shown = hover || value;
  return (
    <fieldset id={id} tabIndex={-1} className="focus:outline-none" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className="font-semibold text-mist">{legend}</legend>
      {hint ? <p className="mt-0.5 text-sm text-lichen">{hint}</p> : null}
      <div className="mt-3 flex items-center gap-1" onMouseLeave={() => setHover(0)}>
        {[1, 2, 3, 4, 5].map((n) => (
          <label
            key={n}
            onMouseEnter={() => setHover(n)}
            className="cursor-pointer rounded-md p-1 has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-signal"
          >
            <input
              type="radio"
              name={id}
              value={n}
              checked={value === n}
              onChange={() => onChange(n)}
              className="sr-only"
            />
            <Star
              aria-hidden="true"
              strokeWidth={1.75}
              className={cn(
                "size-9 transition-colors sm:size-10",
                n <= shown ? "fill-signal text-signal" : "text-lichen/70",
              )}
            />
            <span className="sr-only">
              {n} {n === 1 ? "star" : "stars"}, {OVERALL_WORDS[n]}
            </span>
          </label>
        ))}
        <span aria-hidden="true" className="ml-3 text-sm font-semibold text-mist">
          {shown ? OVERALL_WORDS[shown] : ""}
        </span>
      </div>
      <ErrorText id={id} error={error} />
    </fieldset>
  );
}

type Option = { value: string; label: string; mark?: string };

function ChoiceField({
  id,
  legend,
  name,
  value,
  options,
  error,
  onChange,
  hint,
  compact,
}: {
  id: string;
  legend: ReactNode;
  name: string;
  value: string;
  options: Option[];
  error?: string;
  onChange: (value: string) => void;
  hint?: string;
  compact?: boolean;
}) {
  return (
    <fieldset id={id} tabIndex={-1} className="focus:outline-none" aria-describedby={error ? `${id}-error` : undefined}>
      <legend className={cn(compact ? "text-sm font-semibold text-mist" : "font-semibold text-mist")}>{legend}</legend>
      {hint ? <p className="mt-0.5 text-sm text-lichen">{hint}</p> : null}
      <div className="mt-2.5 flex flex-wrap gap-2">
        {options.map((option) => {
          const checked = value === option.value;
          return (
            <label
              key={option.value}
              className={cn(
                "flex cursor-pointer items-center gap-2 rounded-full border px-3.5 py-2 text-sm font-semibold transition-colors has-[:focus-visible]:outline has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-signal",
                checked ? "border-signal bg-signal text-night" : "border-ridge text-mist hover:border-mist/40",
              )}
            >
              <input
                type="radio"
                name={name}
                value={option.value}
                checked={checked}
                onChange={() => onChange(option.value)}
                className="sr-only"
              />
              {option.mark ? (
                // A dark disc keeps the emoji readable on the yellow selected chip.
                <span aria-hidden="true" className="-ml-1 grid size-6 place-items-center rounded-full bg-night text-[0.8rem] leading-none">
                  {option.mark}
                </span>
              ) : null}
              {option.label}
            </label>
          );
        })}
      </div>
      <ErrorText id={id} error={error} />
    </fieldset>
  );
}

function ExtraAnswer({
  question,
  value,
  error,
  onChange,
}: {
  question: ExtraQuestion;
  value: string | number | null;
  error?: string;
  onChange: (value: string | number | null) => void;
}) {
  const id = domId(`extras.${question.id}`);
  const hint = [question.help, question.required ? "" : "Optional."].filter(Boolean).join(" ");

  if (question.type === "stars") {
    return (
      <StarField
        id={id}
        legend={question.label}
        hint={hint}
        value={typeof value === "number" ? value : 0}
        error={error}
        onChange={onChange}
      />
    );
  }
  if (question.type === "scale" || question.type === "choice") {
    const options: Option[] =
      question.type === "scale"
        ? [...SCALE.map((s) => ({ value: s.value, label: s.label, mark: s.mark })), { value: "NA", label: NOT_APPLICABLE_LABEL }]
        : question.options.map((o) => ({ value: o, label: o }));
    return (
      <ChoiceField
        id={id}
        legend={question.label}
        hint={hint}
        name={id}
        value={typeof value === "string" ? value : ""}
        options={options}
        error={error}
        onChange={onChange}
      />
    );
  }
  // Laid out like the star and choice questions around it: question, then hint, then the answer box.
  return (
    <div>
      <label htmlFor={id} className="block font-semibold text-mist">
        {question.label}
      </label>
      {hint ? (
        <p id={`${id}-hint`} className="mt-0.5 text-sm text-lichen">
          {hint}
        </p>
      ) : null}
      <Textarea
        id={id}
        rows={3}
        maxLength={1000}
        className="mt-2.5"
        value={typeof value === "string" ? value : ""}
        onChange={(e) => onChange(e.target.value)}
        aria-invalid={Boolean(error)}
        aria-describedby={[error ? `${id}-error` : "", hint ? `${id}-hint` : ""].filter(Boolean).join(" ") || undefined}
      />
      <ErrorText id={id} error={error} />
    </div>
  );
}

function ThankYou({ replaced, tripHref, onEdit }: { replaced: boolean; tripHref: string; onEdit: () => void }) {
  return (
    <div className="rounded-panel border border-ridge bg-basalt p-6 text-center sm:p-10" role="status">
      <svg aria-hidden="true" viewBox="0 0 64 64" className="mx-auto size-16" fill="none">
        <circle cx="32" cy="32" r="29" stroke="#E6D65C" strokeOpacity="0.25" strokeWidth="2" />
        <path d="M19 33.5 28 42l17-19" stroke="#E6D65C" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <h2 className="stretch-wide mt-6 text-4xl font-extrabold">Nanni!</h2>
      <p className="mt-2 text-lg font-semibold text-mist">Feedback received</p>
      <p className="measure mx-auto mt-3 text-lichen">
        Thank you for taking the time to help Sanchari Chennai grow.{" "}
        {replaced ? "These answers replaced the ones you sent before." : "Your answers are in."}
      </p>
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Link href={tripHref} className={buttonVariants()}>
          Back to the trip
        </Link>
        <Button variant="outline" onClick={onEdit}>
          Change my answers
        </Button>
      </div>
    </div>
  );
}
