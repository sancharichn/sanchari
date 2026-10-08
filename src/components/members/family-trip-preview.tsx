"use client";

import { useState } from "react";
import { FamilyFields, type FamilyMemberInput } from "./family-fields";

/** Development-only visual proof of the reusable family trip flow. */
export function FamilyTripPreview() {
  const [members, setMembers] = useState<FamilyMemberInput[]>([]);
  const [familyConsent, setFamilyConsent] = useState(false);
  const [parentalConsent, setParentalConsent] = useState(false);
  return <div className="max-w-xl"><FamilyFields members={members} onChange={(next) => { setMembers(next); setFamilyConsent(false); setParentalConsent(false); }} errors={{}} familyConsent={familyConsent} parentalConsent={parentalConsent} onFamilyConsent={setFamilyConsent} onParentalConsent={setParentalConsent} savedMembers={[
    { id: "preview-ananya", name: "Ananya", relationship: "Daughter" },
    { id: "preview-ram", name: "Ram", relationship: "Spouse" },
  ]} /></div>;
}
