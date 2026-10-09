import Link from "next/link";
import { FamilySummary } from "@/components/members/family-summary";
import { countTravellers } from "@/lib/family";
import { ArrowLeft, Download, ExternalLink, Trash2 } from "lucide-react";
import { deleteExpense, deleteTrip, removeRegistration } from "@/actions/admin";
import { AddExpenseDialog } from "@/components/admin/add-expense-dialog";
import { FeedbackResults } from "@/components/admin/feedback-results";
import { FeedbackOpenPanel, FeedbackQuestionsEditor } from "@/components/admin/feedback-setup";
import { ConfirmActionButton } from "@/components/admin/confirm-action-button";
import { ApprovalSelect, GearToggle, PaymentSelect } from "@/components/admin/roster-controls";
import { StatusSwitcher } from "@/components/admin/status-switcher";
import { TripForm, type CoverOption, type TripFormValues } from "@/components/admin/trip-form";
import { StatusBadge } from "@/components/trips/trip-status";
import { buttonVariants } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { AdminTrip, TripResponse } from "@/lib/admin-queries";
import { formatDate, formatDateRange, formatINR, paiseToRupees, toDateInputValue, toPaise } from "@/lib/format";
import { tripPath } from "@/lib/trip-url";
import { computeBalances, settleUp } from "@/lib/settle";
import { parseExtraQuestions } from "@/lib/feedback";
import { OperationsPanel } from "@/components/admin/operations-panel";
import { FeedbackFollowUp } from "@/components/admin/feedback-followup";
import { expectedPayment } from "@/lib/operations";
import { IncidentClose, IncidentControls, TaskEditor, TaskToggle, TripTaskControls } from "@/components/admin/trip-ops-controls";
import { isPublicStatus, parseItinerary, splitRoster, tripTypeLabel } from "@/lib/trips";
import { TripEmailButton } from "@/components/admin/trip-email-button";

type Props = {
  trip: AdminTrip;
  payers: Array<{ id: string; label: string }>;
  adminId: string;
  tab?: string;
  responses: TripResponse[];
  verifiedOnly?: boolean;
  coverChoices?: CoverOption[];
  organisers?: Array<{ id: string; label: string }>;
};

export function AdminTripView({ trip, payers, adminId, tab, responses, verifiedOnly = false, coverChoices = [], organisers = [] }: Props) {
  const isMeetup = trip.kind === "MEETUP";
  const { confirmed, waitlisted } = splitRoster(trip.registrations, trip.maxCapacity);
  const roster = [
    ...confirmed.map((r) => ({ ...r, place: "Seat" })),
    ...waitlisted.map((r, i) => ({ ...r, place: `Waitlist ${i + 1}` })),
    ...trip.registrations.filter((r) => r.approvalStatus !== "APPROVED").map((r) => ({ ...r, place: r.approvalStatus === "DECLINED" ? "Declined" : "Pending approval" })),
  ];

  const names = new Map<string, string>();
  for (const r of trip.registrations) names.set(r.user.id, r.user.name ?? r.user.email);
  for (const e of trip.expenses) names.set(e.paidById, e.paidBy.name ?? e.paidBy.email);
  const nameOf = (id: string) => names.get(id) ?? "Someone";

  const accounts = computeBalances(
    confirmed.map((r) => r.user.id),
    trip.expenses.map((e) => ({ paidById: e.paidById, amountPaise: toPaise(e.amount) })),
    Object.fromEntries(confirmed.map((r) => [r.user.id, r.partySize])),
  );
  const transfers = settleUp(accounts.balances);
  const canDelete = trip.registrations.length + trip.expenses.length + trip.feedbacks.length + trip._count.responses === 0;
  const pendingApproval = trip.registrations.filter((registration) => registration.approvalStatus === "PENDING");
  const pendingPayment = isMeetup ? [] : confirmed.filter((registration) => registration.paymentStatus !== "PAID");
  const pendingArrival = confirmed.filter((registration) => registration.checkedInCount < registration.partySize);
  const unresolvedRides = confirmed.filter((registration) => registration.carpoolChoice === "NEED_RIDE" && !registration.carpoolMatched);

  const initialForm: TripFormValues = {
    title: trip.title,
    kind: trip.kind,
    minimumPriorEvents: String(trip.minimumPriorEvents),
    coverPhotoId: trip.coverPhotoId ?? "",
    location: trip.location,
    description: trip.description,
    startDate: toDateInputValue(trip.startDate),
    endDate: toDateInputValue(trip.endDate),
    maxCapacity: String(trip.maxCapacity),
    budgetEst: trip.budgetEst?.toString() ?? "",
    adultBudgetEst: trip.adultBudgetEst?.toString() ?? "",
    childBudgetEst: trip.childBudgetEst?.toString() ?? "",
    status: trip.status,
    itinerary: parseItinerary(trip.itinerary).map((d) => ({ title: d.title, details: d.details ?? "" })),
  };
  if (initialForm.itinerary.length === 0) initialForm.itinerary.push({ title: "", details: "" });

  const extras = parseExtraQuestions(trip.feedbackForm?.questions);

  const validTabs = isMeetup ? ["operations", "roster", "feedback", "tasks", "incidents", "details"] : ["operations", "roster", "expenses", "feedback", "tasks", "incidents", "details"];
  const defaultTab = tab && validTabs.includes(tab) ? tab : "operations";

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
            {formatDateRange(trip.startDate, trip.endDate)}, {trip.location},{" "}
            {tripTypeLabel(trip.kind, trip.startDate, trip.endDate).toLowerCase()}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <Link href={tripPath(trip)} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <ExternalLink className="size-4" aria-hidden="true" />
              Trip page
            </Link>
            <a href={`/admin/trips/${trip.id}/roster.csv`} className={buttonVariants({ variant: "outline", size: "sm" })}>
              <Download className="size-4" aria-hidden="true" />
              Roster as CSV
            </a>
            {confirmed.length > 0 ? <TripEmailButton tripId={trip.id} meetup={isMeetup} /> : null}
          </div>
        </div>
        <StatusSwitcher tripId={trip.id} status={trip.status} />
      </div>

      <section aria-labelledby="trip-desk-heading" className="mt-8">
        <div className="flex flex-wrap items-baseline justify-between gap-3"><div><h2 id="trip-desk-heading" className="stretch-semiwide text-xl font-bold">Trip desk</h2><p className="mt-1 text-sm text-lichen">The few things that need an organiser&apos;s attention.</p></div><p className="text-sm text-lichen">{countTravellers(confirmed)} confirmed of {trip.maxCapacity} seats</p></div>
        <div className="mt-4 grid gap-px overflow-hidden rounded-panel border border-ridge bg-ridge sm:grid-cols-2 xl:grid-cols-4">
          <DeskSignal href={`/admin/trips/${trip.id}?tab=roster`} label="Awaiting approval" value={pendingApproval.length} note={pendingApproval.length ? "Review new requests" : "All requests reviewed"} urgent={pendingApproval.length > 0} />
          {!isMeetup ? <DeskSignal href={`/admin/trips/${trip.id}?tab=operations`} label="Payment to check" value={pendingPayment.length} note={pendingPayment.length ? "Review receipts" : "No pending payments"} urgent={pendingPayment.length > 0} /> : <DeskSignal href={`/admin/trips/${trip.id}?tab=operations`} label="Meetup readiness" value={pendingArrival.length} note="Check in attendees on the day" />}
          <DeskSignal href={`/admin/trips/${trip.id}?tab=operations`} label="Ride requests" value={unresolvedRides.length} note={unresolvedRides.length ? "Match a shared ride" : "No rides to arrange"} urgent={unresolvedRides.length > 0} />
          <DeskSignal href={`/admin/trips/${trip.id}?tab=tasks`} label="Open tasks" value={trip.tasks.filter((task) => !task.completedAt).length} note="Keep the departure plan moving" urgent={trip.tasks.some((task) => !task.completedAt)} />
        </div>
      </section>

      <Tabs defaultValue={defaultTab} className="mt-10">
        <TabsList aria-label="Manage this trip" className="flex h-auto w-full flex-wrap justify-start">
          <TabsTrigger value="operations">{isMeetup ? "Run meetup" : "Run trip"}</TabsTrigger>
          <TabsTrigger value="roster">
            Roster <Count n={countTravellers(trip.registrations)} />
          </TabsTrigger>
          {!isMeetup ? <TabsTrigger value="expenses">
            Expenses <Count n={trip.expenses.length} />
          </TabsTrigger> : null}
          <TabsTrigger value="feedback">
            Feedback <Count n={trip._count.responses} />
          </TabsTrigger>
          <TabsTrigger value="tasks">Tasks <Count n={trip.tasks.filter((task) => !task.completedAt).length} /></TabsTrigger>
          <TabsTrigger value="incidents">Incidents <Count n={trip.incidents.filter((incident) => !incident.closedAt).length} /></TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
        </TabsList>

        {/* Roster ---------------------------------------------------------- */}
        <TabsContent value="operations">
          <OperationsPanel paymentsEnabled={!isMeetup} people={roster.map((r) => ({ id: r.id, name: r.user.name ?? r.user.email, email: r.user.email, phone: r.user.phone, partySize: r.partySize, checkedInCount: r.checkedInCount, confirmed: r.place === "Seat", expected: isMeetup ? null : expectedPayment(trip, r.companions), net: trip.paymentEvents.filter((p) => p.registrationId === r.id).reduce((n,p) => n+toPaise(p.amount),0), paymentStatus: r.paymentStatus, carpoolChoice: r.carpoolChoice, carpoolLocation: r.carpoolLocation, carpoolSeats: r.carpoolSeats, carpoolMatched: r.carpoolMatched }))} events={trip.paymentEvents.map((p) => ({ id: p.id, name: p.registration.user.name ?? p.registration.user.email, amount: p.amount.toString(), method: p.method, reference: p.reference, note: p.note, by: p.recordedBy.name ?? p.recordedBy.email, date: formatDate(p.createdAt) }))} />
          {!isMeetup ? <a className="mt-6 inline-block text-signal underline" href={`/admin/trips/${trip.id}/payments.csv`}>Export payment ledger</a> : null}
        </TabsContent>
        <TabsContent value="roster">
          <p className="text-sm text-lichen">
            {countTravellers(confirmed)} of {trip.maxCapacity} seats taken
            {waitlisted.length ? `, ${countTravellers(waitlisted)} on the waitlist` : ""}. Seats go in order of registration;
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
                    <TableHead>Approval</TableHead>
                    <TableHead>Member</TableHead>
                    <TableHead>Phone</TableHead>
                    <TableHead>Emergency contact</TableHead>
                    <TableHead>Blood</TableHead>
                    <TableHead>Getting there</TableHead>
                    <TableHead>Car pool</TableHead>
                    {!isMeetup ? <><TableHead>Payment</TableHead><TableHead>Gear</TableHead></> : null}
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
                        <TableCell><ApprovalSelect registrationId={r.id} status={r.approvalStatus} /></TableCell>
                        <TableCell className="min-w-40">
                          <p className="font-semibold text-mist">{name}</p>
                          <p className="text-xs text-lichen">{r.user.email}</p>
                          <FamilySummary companions={r.companions} />
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
                        <TableCell className="min-w-44">{r.carpoolChoice === "NONE" ? <span className="text-lichen">No car pool</span> : `${r.carpoolChoice === "OFFER_RIDE" ? "Offers" : "Needs"} ${r.carpoolSeats ?? ""} from ${r.carpoolLocation ?? "—"}`}</TableCell>
                        {!isMeetup ? <><TableCell><PaymentSelect registrationId={r.id} status={r.paymentStatus} memberName={name} /></TableCell><TableCell><GearToggle registrationId={r.id} checked={r.gearChecked} memberName={name} /></TableCell></> : null}
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
              <dt className="text-sm text-lichen">Adult / child estimate</dt>
              <dd className="mt-2 text-lg font-bold tabular-nums">{trip.adultBudgetEst ?? trip.budgetEst ? `${formatINR(trip.adultBudgetEst ?? trip.budgetEst!)} / ${formatINR(trip.childBudgetEst ?? trip.adultBudgetEst ?? trip.budgetEst!)}` : "—"}</dd>
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
          <details className="mb-6 rounded-panel border border-ridge p-5"><summary className="cursor-pointer font-semibold">Private feedback follow-up ({responses.filter((r) => r.followUpStatus !== "RESOLVED").length} open)</summary><div className="mt-4 grid gap-4 md:grid-cols-2">{responses.map((r) => <article key={r.id} className="rounded-lg border border-ridge p-4"><p className="font-semibold">{r.anonymous ? "Anonymous traveller" : r.name || "Traveller"} · {r.overall}/5</p><p className="text-sm text-lichen">{r.leaderIdea || r.loved || "No written comment"}</p><FeedbackFollowUp id={r.id} status={r.followUpStatus} note={r.followUpNote} /></article>)}</div></details>
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
              {/* Keyed by trip only, so a page refresh (after saving, or opening the form) keeps the editor's
                  unsaved edits and its "Form saved" message. */}
              <FeedbackQuestionsEditor
                key={trip.id}
                tripId={trip.id}
                responseCount={trip._count.responses}
                initialIntro={trip.feedbackForm?.intro ?? ""}
                initialQuestions={extras}
              />
            </div>
          </div>
        </TabsContent>

        <TabsContent value="tasks">
          <section className="rounded-panel border border-ridge bg-basalt p-6"><h2 className="text-xl font-bold">Trip tasks</h2><p className="mt-2 text-sm text-lichen">Keep the departure checklist visible to the whole organising team.</p><TripTaskControls tripId={trip.id} />{trip.tasks.length ? <ul className="mt-6 divide-y divide-ridge border-y border-ridge">{trip.tasks.map((task) => <li key={task.id} className="flex items-center justify-between gap-4 py-4"><div><p className={task.completedAt ? "text-lichen line-through" : "font-semibold text-mist"}>{task.title}</p><p className="mt-1 text-xs text-lichen">{task.owner?.name ?? task.owner?.email ?? "Unassigned"}{task.dueAt ? ` · due ${formatDate(task.dueAt)}` : ""}</p></div><div className="text-right"><span className={`block rounded-full border px-3 py-1 text-xs ${task.completedAt ? "border-emerald-400/40 text-emerald-200" : "border-signal/50 text-signal"}`}>{task.completedAt ? "Done" : "Open"}</span><TaskEditor id={task.id} title={task.title} ownerId={task.ownerId ?? ""} dueAt={task.dueAt ? toDateInputValue(task.dueAt) : ""} organisers={organisers} /><TaskToggle id={task.id} completed={Boolean(task.completedAt)} /></div></li>)}</ul> : null}</section>
        </TabsContent>

        <TabsContent value="incidents">
          <section className="rounded-panel border border-ridge bg-basalt p-6"><h2 className="text-xl font-bold">Incident log</h2><p className="mt-2 text-sm text-lichen">Record safety, transport, health, or conduct issues with an owner and follow-up action.</p><IncidentControls tripId={trip.id} />{trip.incidents.length ? <ul className="mt-6 divide-y divide-ridge border-y border-ridge">{trip.incidents.map((incident) => <li key={incident.id} className="py-4"><div className="flex items-start justify-between gap-4"><div><p className="font-semibold text-mist">{incident.title}</p><p className="mt-1 text-sm text-lichen">{incident.description}</p><p className="mt-2 text-xs text-lichen">Reported by {incident.reportedBy.name ?? incident.reportedBy.email}</p><IncidentClose id={incident.id} actionTaken={incident.actionTaken ?? ""} closed={Boolean(incident.closedAt)} /></div><span className={`rounded-full border px-3 py-1 text-xs ${incident.closedAt ? "border-emerald-400/40 text-emerald-200" : "border-signal/50 text-signal"}`}>{incident.closedAt ? "Closed" : incident.severity}</span></div></li>)}</ul> : null}</section>
        </TabsContent>

        {/* Details --------------------------------------------------------- */}
        <TabsContent value="details">
          <div className="max-w-3xl">
            <TripForm tripId={trip.id} initial={initialForm} photos={coverChoices} />
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

function DeskSignal({ href, label, value, note, urgent = false }: { href: string; label: string; value: number; note: string; urgent?: boolean }) {
  return <Link href={href} className="block bg-basalt p-4 transition-colors hover:bg-white/[0.04]"><p className="text-sm text-lichen">{label}</p><p className={`stretch-narrow mt-2 text-3xl font-bold ${urgent ? "text-signal" : "text-mist"}`}>{value}</p><p className="mt-1 text-xs text-lichen">{note}</p></Link>;
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
