import type { Metadata } from "next";
import { requireAdmin } from "@/lib/session";

export const metadata: Metadata = { title: "Organiser", robots: { index: false } };

export default async function AdminHomePage() {
  const admin = await requireAdmin();
  return (
    <main id="main" className="container py-16">
      <h1 className="stretch-semiwide text-3xl font-bold">Organiser</h1>
      <p className="mt-3 text-lichen">Signed in as {admin.email}.</p>
    </main>
  );
}
