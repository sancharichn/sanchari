"use client";

import { useState } from "react";
import { Camera, Send } from "lucide-react";
import { publishTripToInstagram } from "@/actions/admin-instagram";
import { FormMessage, useActionRunner } from "@/components/forms/use-action-runner";
import { Button } from "@/components/ui/button";

function campaignId() { return crypto.randomUUID(); }

export function InstagramPublisher({ tripId, title, caption: initialCaption, imageUrl, configured }: { tripId: string; title: string; caption: string; imageUrl: string | null; configured: boolean }) {
  const [caption, setCaption] = useState(initialCaption);
  const [reviewed, setReviewed] = useState(false);
  const [id, setId] = useState(campaignId);
  const publish = useActionRunner();
  return <section className="mt-8 overflow-hidden rounded-panel border border-[#d96b9a]/35 bg-[linear-gradient(135deg,rgba(131,58,180,.13),rgba(253,29,29,.07),rgba(252,176,69,.09))] p-5 sm:p-6" aria-labelledby="instagram-publisher-heading">
    <div className="flex items-start gap-3"><span className="rounded-xl bg-[#d96b9a]/15 p-2.5 text-[#ef8ab5]"><Camera className="size-5" /></span><div><p className="text-xs font-bold uppercase tracking-[.15em] text-[#ef8ab5]">Social publishing</p><h2 id="instagram-publisher-heading" className="mt-1 text-xl font-bold">Post this trip to Instagram</h2><p className="mt-1 text-sm text-lichen">Review the cover and caption. Publishing sends it immediately to the connected Sanchari professional account.</p></div></div>
    <div className="mt-5 grid gap-5 lg:grid-cols-[15rem_1fr]">{imageUrl ? <img src={imageUrl} alt={`Cover preview for ${title}`} className="aspect-square w-full rounded-2xl border border-ridge object-cover" /> : <div className="flex aspect-square items-center justify-center rounded-2xl border border-dashed border-ridge p-5 text-center text-sm text-lichen">Choose a cover photo in Edit details first.</div>}<div className="grid gap-3"><label className="grid gap-1.5 text-sm font-semibold">Instagram caption<textarea value={caption} onChange={(event) => setCaption(event.target.value)} maxLength={2200} rows={8} className="rounded-lg border border-ridge bg-night px-3 py-3 font-normal leading-relaxed" /></label><div className="flex justify-between text-xs text-lichen"><span>Public trip link and hashtags are included.</span><span>{caption.length}/2200</span></div><label className="flex items-start gap-3 rounded-xl border border-ridge p-3 text-sm text-lichen"><input type="checkbox" checked={reviewed} onChange={(event) => setReviewed(event.target.checked)} className="mt-1" />I reviewed the image and caption and want to publish this post now.</label><Button disabled={!configured || !imageUrl || !reviewed || publish.pending || caption.trim().length < 10} onClick={() => void publish.run(() => publishTripToInstagram({ tripId, campaignId: id, caption }), (result) => { if (result.ok) { setId(campaignId()); setReviewed(false); } })}><Send className="size-4" />{publish.pending ? "Publishing…" : "Publish to Instagram"}</Button>{!configured ? <p className="text-sm text-ember">The current Instagram token does not expose publishing yet. Reconnect it with the content-publishing permission.</p> : null}<FormMessage result={publish.result} /></div></div>
  </section>;
}
