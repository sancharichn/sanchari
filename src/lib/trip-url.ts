/** A stable, readable address for a public trip page. */
export function tripSlugFromTitle(title: string): string {
  return (
    title
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 70)
      .replace(/-+$/g, "") || "trip"
  );
}

/** Falls back to the legacy ID until older trip records receive their slug. */
export function tripPath(trip: { id: string; slug?: string | null }): string {
  return `/trips/${trip.slug || trip.id}`;
}
