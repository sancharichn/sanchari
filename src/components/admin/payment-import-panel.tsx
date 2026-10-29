"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { CheckCircle2, Download, FileSpreadsheet, Upload, XCircle } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { formatINR } from "@/lib/format";

type PreviewRow = { row: number; member: string; traveller: string; amount: number | string; method: string; date: string; status: string };
type ResponseData = { ok?: boolean; error?: string; message?: string; valid?: number; invalid?: number; rows?: PreviewRow[] };

export type ImportBatchSummary = { id: string; fileName: string; rowCount: number; importedCount: number; date: string; by: string };

export function PaymentImportPanel({ tripId, tripTitle, batches = [] }: { tripId: string; tripTitle: string; batches?: ImportBatchSummary[] }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [data, setData] = useState<ResponseData | null>(null);
  const [pending, setPending] = useState(false);
  async function submit(mode: "preview" | "commit") {
    if (!file) return;
    setPending(true);
    try {
      const form = new FormData(); form.set("file", file); form.set("mode", mode);
      const response = await fetch(`/api/admin/trips/${tripId}/payments/import`, { method: "POST", body: form });
      const next = await response.json() as ResponseData;
      setData(next);
      if (response.ok && mode === "commit") router.refresh();
    } catch { setData({ error: "The upload did not complete. Check the connection and try again." }); }
    finally { setPending(false); }
  }
  const canCommit = Boolean(data?.rows?.length && data.invalid === 0 && !data.message);
  return <section className="grid gap-6">
    <div className="rounded-panel border border-ridge bg-basalt p-5 sm:p-6"><div className="flex flex-wrap items-start justify-between gap-4"><div><p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[.15em] text-signal"><FileSpreadsheet className="size-4" /> Spreadsheet import</p><h3 className="mt-2 text-xl font-bold">Import funds for {tripTitle}</h3><p className="mt-2 max-w-3xl text-sm leading-6 text-lichen">Download the prefilled template, enter one receipt or refund per row, then preview it before committing. CSV and Excel .xlsx files are accepted. Nothing is saved during preview.</p></div><a href={`/api/admin/trips/${tripId}/payments/template`} className={buttonVariants({ variant: "outline" })}><Download className="size-4" />Download template</a></div>
      <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]"><label className="grid gap-1.5 text-sm font-semibold">Fund sheet<input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={(event) => { setFile(event.target.files?.[0] ?? null); setData(null); }} className="min-h-12 rounded-lg border border-ridge bg-night px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-signal file:px-3 file:py-1.5 file:font-semibold file:text-night" /></label><Button type="button" className="self-end" disabled={!file || pending} onClick={() => void submit("preview")}><Upload className="size-4" />{pending ? "Reading…" : "Preview import"}</Button></div>
      <p className="mt-3 text-xs text-lichen">Required: Registration ID or member email, traveller name, amount, entry type, method and received date. Maximum 500 rows / 2 MB.</p>
    </div>
    {data?.error ? <p role="alert" className="rounded-xl border border-ember/40 bg-ember/10 p-4 text-sm text-ember">{data.error}</p> : null}
    {data?.message ? <p role="status" className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 p-4 text-sm text-emerald-200">{data.message}</p> : null}
    {data?.rows?.length ? <div className="overflow-hidden rounded-panel border border-ridge"><div className="flex flex-wrap items-center justify-between gap-3 border-b border-ridge bg-basalt p-4"><div><h4 className="font-bold">Import preview</h4><p className="text-xs text-lichen">{data.valid ?? 0} ready · {data.invalid ?? 0} need attention</p></div>{canCommit ? <Button type="button" disabled={pending} onClick={() => void submit("commit")}><CheckCircle2 className="size-4" />{pending ? "Importing…" : `Import ${data.valid} entries`}</Button> : null}</div><div className="max-h-[32rem] overflow-auto"><table className="w-full min-w-[760px] text-left text-sm"><thead className="sticky top-0 bg-night text-xs uppercase tracking-wide text-lichen"><tr><th className="p-3">Row</th><th className="p-3">Member</th><th className="p-3">Traveller</th><th className="p-3 text-right">Amount</th><th className="p-3">Method</th><th className="p-3">Date</th><th className="p-3">Validation</th></tr></thead><tbody className="divide-y divide-ridge">{data.rows.map((row) => <tr key={row.row}><td className="p-3 tabular-nums">{row.row}</td><td className="p-3">{row.member}</td><td className="p-3 font-semibold">{row.traveller}</td><td className="p-3 text-right tabular-nums">{typeof row.amount === "number" ? formatINR(row.amount) : row.amount}</td><td className="p-3">{row.method}</td><td className="p-3">{row.date}</td><td className={`p-3 ${row.status === "Ready" ? "text-emerald-300" : "text-ember"}`}>{row.status === "Ready" ? <span className="inline-flex items-center gap-1"><CheckCircle2 className="size-4" />Ready</span> : <span className="inline-flex items-center gap-1"><XCircle className="size-4 shrink-0" />{row.status}</span>}</td></tr>)}</tbody></table></div></div> : null}
    {batches.length ? <div className="rounded-panel border border-ridge bg-basalt p-5"><h4 className="font-bold">Recent imports</h4><div className="mt-3 divide-y divide-ridge">{batches.map((batch) => <div key={batch.id} className="flex flex-wrap items-center justify-between gap-2 py-3 text-sm"><div><p className="font-semibold text-mist">{batch.fileName}</p><p className="text-xs text-lichen">{batch.date} · {batch.by}</p></div><span className="text-lichen">{batch.importedCount} / {batch.rowCount} rows</span></div>)}</div></div> : null}
  </section>;
}
