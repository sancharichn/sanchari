import type { Metadata } from "next";
import { FILTERS, SuggestionsBoard, type SuggestionFilter } from "@/components/admin/suggestions-board";
import { getSuggestions } from "@/lib/admin-queries";

export const metadata: Metadata = { title: "Organiser: suggestions" };

export default async function AdminSuggestionsPage({ searchParams }: { searchParams: { status?: string } }) {
  const suggestions = await getSuggestions();
  const status = searchParams.status as SuggestionFilter;
  return <SuggestionsBoard suggestions={suggestions} filter={FILTERS.includes(status) ? status : "NEW"} />;
}
