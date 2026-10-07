import { BirthdayCardPreviews } from "@/components/admin/birthday-card-previews";

export default function BirthdayPreviewPage() {
  return <main className="container py-12"><p className="text-sm text-signal">Local preview</p><h1 className="mt-2 text-4xl font-black">Birthday card templates</h1><p className="mt-3 max-w-2xl text-lichen">Preview of the five private birthday card styles organisers can use. This sample page does not send anything.</p><div className="mt-10 max-w-3xl"><BirthdayCardPreviews contact={{ name: "Ananya", image: null }} /></div></main>;
}
