import Link from "next/link";
import { ArrowLeft, Download, ExternalLink, Trash2 } from "lucide-react";
import { deleteExpense, deleteTrip, removeRegistration } from "@/actions/admin";
import { AddExpenseDialog } from "@/components/admin/add-expense-dialog";
import { FeedbackResults } from "@/components/admin/feedback-results";
import { FeedbackOpenPanel, FeedbackQuestionsEditor } from "@/components/admin/feedback-setup";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { GearToggle, PaymentSelect } from "@/components/admin/roster-controls";
import { StatusSwitcher } from "@/components/admin/status-switcher";
import { TripForm, type TripFormValues } from "@/components/admin/trip-form";
import { StatusBadge } from "@/components/trips/trip-status";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminTrip, TripResponse } from "@/lib/admin-queries";
import { formatDate, formatDateRange, formatINR, paiseToRupees, toDateInputValue, toPaise } from "@/lib/format";
import { computeBalances, settleUp } from "@/lib/settle";
import { parseExtraQuestions } from "@/lib/feedback";
import { isPublicStatus, parseItinerary, splitRoster } from "@/lib/trips";

type Props = {
  trip: AdminTrip;
  payers: Array<{ id: string; label: string }>;
  adminId: string;
  tab?: string;
  responses: TripResponse[];
  verifiedOnly?: boolean;
};

export function AdminTripView({ trip, payers, adminId, tab, responses, verifiedOnly = false }: Props) {
  const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
  const roster = [
    ...confirmed.map((r) => ({ ...r, place: "Seat" })),
    ...waitlisted.map((r, i) => ({ ...r, place: `Waitlist ${i + 1}` })),
  ];

  const names = new Map<string, string>();
  for (const r of trip.registrations) names.set(r.user.id, r.user.name ?? r.user.email);
  for (const e of trip.expenses) names.set(e.paidById, e.paidBy.name ?? e.paidBy.email);
  const nameOf = (id: string) => names.get(id) ?? "Someone";

  const accounts = computeBalances(
    confirmed.map((r) => r.user.id),
    trip.expenses.map((e) => ({ paidById: e.paidById, amountPaise: toPaise(e.amount) })),
  );
  const transfers = settleUp(accounts.balances);
  const canDelete = trip.registrations.length + trip.expenses.length + trip.feedbacks.length + trip._count.responses === 0;

  const initialForm: TripFormValues = {
    title: trip.title,
    location: trip.location,
    description: trip.description,
    startDate: toDateInputValue(trip.startDate),
    endDate: toDateInputValue(trip.endDate),
    maxCapacity: String(trip.maxCapacity),
    budgetEst: trip.budgetEst?.toString() ?? "",
    status: trip.status,
    itinerary: parseItinerary(trip.itinerary).map((d) => ({ title: d.title, details: d.details ?? "" })),
  };
  if (initialForm.itinerary.length === 0) initialForm.itinerary.push({ title: "", details: "" });

  const extras = parseExtraQuestions(trip.feedbackForm?.questions);

  const validTabs = ["roster", "expenses", "feedback", "details"];
  const defaultTab = tab && validTabs.includes(tab) ? tab : "roster";

  return (
    <main id="main" className="container py-10 md:py-14 xl:max-w-[1360px]">
      <Link href="/admin/trips" className="inline-flex items-center gap-2 text-sm font-semibold text-lichen hover:text-mist">
        <ArrowLeft className="size-4" aria-hidden="true" />
        Trips
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
        <div>
          <StatusBadge status={trip.status} />
          <h1 className="stretch-semiwide mt-3 text-3xl font-bold leading-tight md:text-4xl">{trip.title}</h1>
          <p className="mt-2 text-lichen">
            {formatDateRange(trip.startDate, trip.endDate)}, {trip.location}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={`/trips/${trip.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Trip page
            </Link>
            <a href={`/admin/trips/${trip.id}/roster.csv`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Download className="size-4" aria-hidden="true" />
              Roster as CSV
            </a>
          </div>
        </div>
        <StatusSwitcher tripId={trip.id} status={trip.status} />
      </div>

      <Tabs defaultValue={defaultTab} className="mt-10">
        <TabsList aria-label="Manage this trip">
          <TabsTrigger value="roster">
            Roster <Count n={trip.registrations.length} />
          </TabsTrigger>
          <TabsTrigger value="expenses">
            Expenses <Count n={trip.expenses.length} />
          </TabsTrigger>
          <TabsTrigger value="feedback">
            Feedback <Count n={trip._count.responses} />
          </TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Roster ---------------------------------------------------------- */}
        <TabsContent value="roster">
          <p className="text-sm text-lichen">
            {confirmed.length} of {trip.maxCapacity} seats taken
            {waitlisted.length ? `, ${waitlisted.length} on the waitlist` : ""}. Seats go in order of registration;
            removing someone moves the waitlist up.
          </p>
          {roster.length === 0 ? (
            <p className="mt-6 text-mist">Nobody has registered yet.</p>
          ) : (
            <div className="mt-6">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Place</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Emergency contact</TableHead>
                    <TableHead>Blood</TableHead>
                    <TableHead>Getting there</TableHead>
                    <TableHead>Payment</TableHead>
                    <TableHead>Gear</TableHead>
                    <TableHead>
                      <span className="sr-only">Remove</span>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {roster.map((r) => {
                    const name = r.user.name ?? r.user.email;
                    return (
                      <TableRow key={r.id} className={r.place === "Seat" ? undefined : "opacity-80"}>
                        <TableCell className="stretch-narrow whitespace-nowrap font-semibold">{r.place}</TableCell>
                        <TableCell className="min-w-40">
                          <p className="font-semibold text-mist">{name}</p>
                          <p className="text-xs text-lichen">{r.user.email}</p>
                        </TableCell>
                        <TableCell className="whitespace-nowrap">
                          {r.user.phone ? (
                            <a href={`tel:${r.user.phone.replace(/[^\d+]/g, "")}`} className="underline-offset-4 hover:underline">
                              {r.user.phone}
                            </a>
                          ) : (
                            <span className="text-lichen">Not given</span>
                          )}
                        </TableCell>
                        <TableCell className="min-w-44">{r.user.emergencyContact ?? <span className="text-lichen">Not given</span>}</TableCell>
                        <TableCell>{r.user.bloodGroup ?? <span className="text-lichen">—</span>}</TableCell>
                        <TableCell className="min-w-40">{r.vehicleDetails ?? <span className="text-lichen">Needs a seat</span>}</TableCell>
                        <TableCell>
                          <PaymentSelect registrationId={r.id} status={r.paymentStatus} memberName={name} />
                        </TableCell>
                        <TableCell>
                          <GearToggle registrationId={r.id} checked={r.gearChecked} memberName={name} />
                        </TableCell>
                        <TableCell>
                          <ConfirmActionButton
                            label="Remove"
                            ariaLabel={`Remove ${name}`}
                            icon={<Trash2 className="size-4" aria-hidden="true" />}
                            className="text-lichen hover:text-ember"
                            title={`Remove ${name}?`}
                            description="Their registration is deleted and the waitlist moves up. Their account and details stay."
                            confirmLabel="Remove registration"
                            pendingLabel="Removing…"
                            variant="ghost"
                            action={removeRegistration.bind(null, r.id)}
                          />
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </TabsContent>

        {/* Expenses -------------------------------------------------------- */}
        <TabsContent value="expenses">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <p className="measure text-sm text-lichen">
              Shared costs, split equally across the {accounts.travellers} {accounts.travellers === 1 ? "person" : "people"} with a
              seat. Trip fees members paid you are tracked as payment status on the roster, not here.
            </p>
            <AddExpenseDialog tripId={trip.id} payers={payers} defaultPayerId={adminId} />
          </div>

          <dl className="mt-8 grid grid-cols-2 gap-px overflow-hidden rounded-panel border border-ridge bg-ridge md:grid-cols-4">
            <Money label="Spent" paise={accounts.total} />
            <Money label="Per person" paise={accounts.travellers ? accounts.perHead : null} />
            <div className="bg-basalt p-5">
              <dt className="text-sm text-lichen">Estimate per person</dt>
              <dd className="stretch-narrow mt-2 text-3xl font-bold tabular-nums">{trip.budgetEst ? formatINR(trip.budgetEst) : "—"}</dd>
            </div>
            <div className="bg-basalt p-5">
              <dt className="text-sm text-lichen">Against the estimate</dt>
              <dd className="stretch-narrow mt-2 text-3xl font-bold tabular-nums">
                {trip.budgetEst && accounts.travellers
                  ? (() => {
                      const diff = accounts.perHead - toPaise(trip.budgetEst);
                      return diff === 0 ? "On budget" : `${diff > 0 ? "+" : "−"}${formatINR(paiseToRupees(Math.abs(diff)))}`;
                    })()
                  : "—"}
              </dd>
            </div>
          </dl>

          {trip.expenses.length === 0 ? (
            <p className="mt-8 text-mist">No expenses logged yet.</p>
          ) : (
            <>
              <div className="mt-8">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>What for</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead>Paid by</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead>Receipt</TableHead>
                      <TableHead>
                        <span className="sr-only">Delete</span>
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {trip.expenses.map((e) => (
                      <TableRow key={e.id}>
                        <TableCell className="whitespace-nowrap text-lichen">{formatDate(e.createdAt)}</TableCell>
                        <TableCell className="min-w-48 font-semibold">{e.title}</TableCell>
                        <TableCell className="whitespace-nowrap">{e.category}</TableCell>
                        <TableCell className="whitespace-nowrap">{nameOf(e.paidById)}</TableCell>
                        <TableCell className="stretch-narrow whitespace-nowrap text-right text-base font-semibold tabular-nums">
                          {formatINR(e.amount)}
                        </TableCell>
                        <TableCell>
                          {e.receiptUrl ? (
                            <a href={e.receiptUrl} target="_blank" rel="noopener noreferrer" className="text-signal underline-offset-4 hover:underline">
                              Open
                            </a>
                          ) : (
                            <span className="text-lichen">—</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <ConfirmActionButton
                            label="Delete"
                            title="Delete this expense?"
                            description={`${e.title}, ${formatINR(e.amount)}. The split is recalculated without it.`}
                            confirmLabel="Delete expense"
                            pendingLabel="Deleting…"
                            variant="ghost"
                            action={deleteExpense.bind(null, e.id)}
                          />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="mt-12 grid gap-10 lg:grid-cols-2">
                <section aria-labelledby="balances-heading">
                  <h2 id="balances-heading" className="stretch-semiwide text-xl font-bold">
                    Who paid what
                  </h2>
                  <div className="mt-5">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Person</TableHead>
                          <TableHead className="text-right">Paid</TableHead>
                          <TableHead className="text-right">Share</TableHead>
                          <TableHead className="text-right">Balance</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {accounts.balances.map((b) => (
                          <TableRow key={b.userId}>
                            <TableCell>{nameOf(b.userId)}</TableCell>
                            <TableCell className="stretch-narrow text-right tabular-nums">{formatINR(paiseToRupees(b.paid))}</TableCell>
                            <TableCell className="stretch-narrow text-right tabular-nums">{formatINR(paiseToRupees(b.share))}</TableCell>
                            <TableCell
                              className={`stretch-narrow text-right font-semibold tabular-nums ${b.balance > 0 ? "text-signal" : b.balance < 0 ? "text-ember" : "text-lichen"}`}
                            >
                              {b.balance === 0
                                ? "Square"
                                : `${b.balance > 0 ? "Owed " : "Owes "}${formatINR(paiseToRupees(Math.abs(b.balance)))}`}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </section>

                <section aria-labelledby="settle-heading">
                  <h2 id="settle-heading" className="stretch-semiwide text-xl font-bold">
                    To settle up
                  </h2>
                  <p className="mt-2 text-sm text-lichen">If everyone splits these costs equally, these payments square it.</p>
                  {transfers.length === 0 ? (
                    <p className="mt-5 text-mist">Everyone is square.</p>
                  ) : (
                    <ul className="mt-5 divide-y divide-ridge border-y border-ridge">
                      {transfers.map((t, i) => (
                        <li key={i} className="flex flex-wrap items-baseline justify-between gap-3 py-3">
                          <span>
                            <span className="font-semibold">{nameOf(t.from)}</span> pays{" "}
                            <span className="font-semibold">{nameOf(t.to)}</span>
                          </span>
                          <span className="stretch-narrow text-lg font-bold tabular-nums">{formatINR(paiseToRupees(t.amount))}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              </div>
            </>
          )}
        </TabsContent>

        {/* Feedback -------------------------------------------------------- */}
        <TabsContent value="feedback">
          <div className="grid gap-12">
            <FeedbackOpenPanel
              tripId={trip.id}
              tripTitle={trip.title}
              isOpen={Boolean(trip.feedbackForm?.isOpen)}
              tripVisible={isPublicStatus(trip.status)}
            />
            {responses.length > 0 ? (
              <FeedbackResults tripId={trip.id} responses={responses} extras={extras} verifiedOnly={verifiedOnly} />
            ) : (
              <p className="text-mist">
                No answers yet. Once the form is open, answers and scores appear here as they come in.
              </p>
            )}
            <div className="border-t border-ridge pt-10">
              <FeedbackQuestionsEditor
                key={JSON.stringify(trip.feedbackForm ?? null)}
                tripId={trip.id}
                responseCount={trip._count.responses}
                initialIntro={trip.feedbackForm?.intro ?? ""}
                initialQuestions={extras}
              />
            </div>
          </div>
        </TabsContent>

        {/* Details --------------------------------------------------------- */}
        <TabsContent value="details">
          <div className="max-w-3xl">
            <TripForm tripId={trip.id} initial={initialForm} />
            <div className="mt-14 rounded-panel border border-ember/40 p-6">
              <h2 className="text-lg font-bold">Delete this trip</h2>
              {canDelete ? (
                <>
                  <p className="mt-1 text-sm text-lichen">Nobody has registered, spent or reviewed anything, so it can go.</p>
                  <div className="mt-4">
                    <ConfirmActionButton
                      label="Delete trip"
                      title={`Delete ${trip.title}?`}
                      description="The trip and its itinerary are deleted for good."
                      confirmLabel="Delete trip"
                      pendingLabel="Deleting…"
                      action={deleteTrip.bind(null, trip.id)}
                      redirectTo="/admin/trips"
                    />
                  </div>
                </>
              ) : (
                <p className="mt-1 text-sm text-lichen">
                  This trip has registrations, expenses or feedback, so it stays in the records. Set its status to Archived
                  to hide it from the site.
                </p>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
    </main>
  );
}

function Count({ n }: { n: number }) {
  return <span className="stretch-narrow tabular-nums opacity-70">{n}</span>;
}

function Money({ label, paise }: { label: string; paise: number | null }) {
  return (
    <div className="bg-basalt p-5">
      <dt className="text-sm text-lichen">{label}</dt>
      <dd className="stretch-narrow mt-2 text-3xl font-bold tabular-nums">{paise === null ? "—" : formatINR(paiseToRupees(paise))}</dd>
    </div>
  );
}
