"use client";
import { useState } from "react";

/** Re-encode and resize on-device: strips camera metadata and limits database size. */
export function PhotoUpload({ label, value, onChange }: { label: string; value: string | null; onChange: (value: string | null) => void }) {
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  return <div className="space-y-2">
    {value && <img src={value} alt={label} width={80} height={80} className="h-20 w-20 rounded-full object-cover" />}
    <label className="block text-sm">{label}<input className="mt-2 block w-full text-sm" type="file" accept="image/jpeg,image/png,image/webp" disabled={busy} onChange={async (event) => {
      const file = event.target.files?.[0]; if (!file) return; setError(""); setBusy(true);
      try {
        if (file.size > 10 * 1024 * 1024) throw new Error("Choose an image smaller than 10 MB.");
        const bitmap = await createImageBitmap(file);
        const canvas = document.createElement("canvas"); const scale = Math.min(1, 512 / Math.max(bitmap.width, bitmap.height));
        canvas.width = Math.round(bitmap.width * scale); canvas.height = Math.round(bitmap.height * scale);
        const context = canvas.getContext("2d"); if (!context) throw new Error("This browser could not process the image.");
        context.fillStyle = "#ffffff"; context.fillRect(0,0,canvas.width,canvas.height); context.drawImage(bitmap,0,0,canvas.width,canvas.height); bitmap.close();
        const encoded = canvas.toDataURL("image/jpeg", 0.8);
        if (encoded.length > 350000) throw new Error("Choose a simpler or smaller image.");
        onChange(encoded);
      } catch (e) { setError(e instanceof Error ? e.message : "Could not read the photo."); } finally { setBusy(false); event.target.value = ""; }
    }} /></label>
    <p className="text-xs text-lichen">Photo is saved when you select Save details. It is used for your private birthday card.</p>
    {value && <button type="button" className="text-sm text-signal underline" onClick={() => onChange(null)}>Remove photo</button>}
    {busy && <p role="status">Preparing photo…</p>}{error && <p role="alert" className="text-sm text-ember">{error}</p>}
  </div>;
}
