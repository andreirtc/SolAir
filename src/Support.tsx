import { useState, type FormEvent } from "react";
import { Flag } from "lucide-react";
import { api } from "./api";
import HelpResources from './HelpResources';

export function HelpSupport({ go }: { go: (page: string,target?:string) => void }) {
 return <HelpResources go={go}/>;
}
export function ProblemReport({ page, mode, vehicleId }: { page: string; mode: string; vehicleId?: string }) {
  const [busy, setBusy] = useState(false), [error, setError] = useState(""), [receipt, setReceipt] = useState("");
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget, fields = new FormData(form);
    setBusy(true); setError(""); setReceipt("");
    try {
      const result = await api("/problem-reports", "POST", { summary: fields.get("summary"), details: fields.get("details"), page, mode, vehicle_id: vehicleId || null });
      setReceipt(result.id); form.reset();
    } catch (cause) { setError((cause as Error).message + ". Your report was not confirmed. You can retry."); }
    finally { setBusy(false); }
  }
  return <section className="panel support-panel">
    <h2><Flag size={23} /> Report a problem</h2>
    <p>Describe an issue with SOLAIR. Your report is saved for your administrator in the audit trail. For vehicle emergencies, use SOS &amp; Assistance.</p>
    {receipt && <div className="report-receipt" role="status"><strong>Report received</strong><p>Reference: {receipt}</p></div>}
    <form onSubmit={submit}>
      <label>Summary<input name="summary" minLength={5} maxLength={120} required placeholder="What went wrong?" /></label>
      <label>What happened?<textarea name="details" minLength={10} maxLength={4000} required placeholder="What were you trying to do, and what happened instead?" /></label>
      <p className="subtle">Do not include passwords or device tokens. Your account, selected vehicle and data mode are included.</p>
      {error && <p className="error" role="alert">{error}</p>}
      <button className="primary" disabled={busy}>{busy ? "Submitting…" : "Submit report"}</button>
    </form>
  </section>;
}
