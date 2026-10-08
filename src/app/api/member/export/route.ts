import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/session";
import { auditedTransaction, prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in first." }, { status: 401 });
  const data = await auditedTransaction(user.id, async () => {
    const profile = await prisma.user.findUnique({ where: { id: user.id }, select: { name: true, email: true, image: true, phone: true, emergencyContact: true, bloodGroup: true, birthdayDay: true, birthdayMonth: true, whatsappOptIn: true, whatsappNumber: true, createdAt: true, familyMembers: true } });
    const registrations = await prisma.tripRegistration.findMany({ where: { userId: user.id }, select: { id: true, createdAt: true, partySize: true, companions: true, vehicleDetails: true, carpoolChoice: true, carpoolLocation: true, carpoolSeats: true, checkedInCount: true, paymentStatus: true, agreedToGuidelinesAt: true, familyConsentAt: true, parentalConsentAt: true, trip: { select: { title: true, startDate: true, endDate: true, location: true } }, paymentEvents: { select: { amount: true, method: true, reference: true, createdAt: true } } } });
    const feedback = await prisma.feedbackResponse.findMany({ where: { userId: user.id }, select: { tripId: true, name: true, whatsapp: true, overall: true, ratings: true, extras: true, loved: true, nextPlace: true, leaderIdea: true, comeAgain: true, shareOk: true, createdAt: true } });
    const groupFeedback = await prisma.feedback.findMany({ where: { userId: user.id }, select: { rating: true, comment: true, createdAt: true } });
    const cancellations = await prisma.cancellation.findMany({ where: { userId: user.id } });
    const requests = await prisma.dataRequest.findMany({ where: { userId: user.id } });
    await prisma.dataRequest.create({ data: { userId: user.id, kind: "EXPORT", status: "COMPLETED", resolvedAt: new Date() } });
    return { exportedAt: new Date().toISOString(), profile, registrations, feedback, groupFeedback, cancellations, requests };
  });
  return NextResponse.json(data, { headers: { "Cache-Control": "private, no-store", "Content-Disposition": 'attachment; filename="sanchari-profile.json"' } });
}
