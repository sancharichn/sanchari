import { notFound } from "next/navigation";
import { BirthdayPickerDemo } from "@/components/members/birthday-picker";
import { FamilyTripPreview } from "@/components/members/family-trip-preview";

export default function PreviewProfilePage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <main id="main" className="mobile-glass-screen"><div className="container py-14 md:py-20"><p className="text-sm text-signal">Local visual preview · no details are saved here</p><h1 className="stretch-wide mt-3 text-4xl font-extrabold leading-none md:text-5xl">Birthday wishes</h1><p className="measure mt-5 text-lg text-lichen">Month and day are selected with a tap. Birth year is never requested or stored.</p><div className="mt-10"><BirthdayPickerDemo /></div><section className="mt-14 border-t border-ridge pt-10"><p className="text-sm text-signal">Future trip registration</p><h2 className="mt-2 text-2xl font-bold">Add saved family in one tap</h2><p className="measure mt-3 text-lichen">Names and relationships are reused. The member only confirms each traveller&apos;s current age, so adult and child trip prices remain accurate without storing a birth year.</p><div className="mt-7"><FamilyTripPreview /></div></section></div></main>;
}
