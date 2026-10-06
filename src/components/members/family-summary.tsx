import { readCompanions } from "@/lib/family";

/** Rendered only for the registration owner or an authenticated organiser. */
export function FamilySummary({ companions }: { companions: unknown }) {
  const people = readCompanions(companions);
  if (!people.length) return null;
  return (
    <div className="my-4 rounded-xl border border-ridge p-4 text-sm">
      <p className="font-semibold text-mist">Family registration · {people.length + 1} people</p>
      <ul className="mt-3 grid gap-3 text-lichen">
        {people.map((person, index) => (
          <li key={index}>
            <span className="font-semibold text-mist">{person.name}</span>
            <span className="block">{person.age} {person.age === 1 ? "year" : "years"} · {person.age < 18 ? "Child" : "Adult"} · {person.relationship}</span>
            {person.bloodGroup ? <span className="block">Blood group: {person.bloodGroup}</span> : null}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-lichen">These family members are included with the registering adult. Payment, gear checks and cancellation apply to the whole registration.</p>
    </div>
  );
}
