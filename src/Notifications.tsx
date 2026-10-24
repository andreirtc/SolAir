import { useEffect, useRef, useState } from "react";
import { Bell, CheckCheck, MessageSquare, Radio, Shield, Sun, LifeBuoy, X, Settings, Mailbox, Check, ArrowUpRight } from "lucide-react";
import { api, stamp } from "./api";
import type { Profile } from "./types";
import type { ActivityNotification } from "../packages/notifications";

function readSaved(key: string): string[] {
  try {
    const values: unknown = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(values) ? values.filter((v): v is string => typeof v === "string").slice(-500) : [];
  } catch { return []; }
}
const icons = { security: Shield, alert: Shield, energy: Sun, system: Radio, assistance: LifeBuoy, message: MessageSquare };
export default function Notifications({ user, mode, refreshKey, go, select, fullPage=false, onPreferenceSaved }: {
  user: Profile; mode: string; refreshKey: number; go: (page: string) => void; select: (id: string) => void;
  fullPage?:boolean; onPreferenceSaved?:()=>Promise<void>;
}) {
  const key = `solair-notifications-read:${user.id}:${user.org_id}:${mode}`;
  const [open, setOpen] = useState(false), [items, setItems] = useState<ActivityNotification[]>([]);
  const [seen, setSeen] = useState<string[]>(() => readSaved(key));
  const [error, setError] = useState(""), [loading, setLoading] = useState(true), [retry, setRetry] = useState(0);
  const [category, setCategory] = useState("all");
  const [introDone,setIntroDone]=useState(false),[introBusy,setIntroBusy]=useState(false),[introError,setIntroError]=useState("");
  const root = useRef<HTMLDivElement>(null), trigger = useRef<HTMLButtonElement>(null), close = useRef<HTMLButtonElement>(null);
  useEffect(() => {
    let active = true;
    void api(`/notifications?mode=${mode}`).then((data) => {
      if (active) { setItems(data); setError(""); setLoading(false); }
    }).catch(() => { if (active) { setError("Updates could not be refreshed. Previously loaded activity may be stale."); setLoading(false); } });
    return () => { active = false; };
  }, [mode, user.id, user.org_id, refreshKey, retry]);
  useEffect(() => {
    const sync = (event: StorageEvent) => { if (event.key === key || event.key === null) setSeen(readSaved(key)); };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [key]);
  useEffect(() => {
    if (!open || fullPage) return;
    close.current?.focus();
    const outside = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) setOpen(false); };
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { setOpen(false); trigger.current?.focus(); } };
    document.addEventListener("pointerdown", outside); document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("pointerdown", outside); document.removeEventListener("keydown", escape); };
  }, [open,fullPage]);
  const visibleItems = items.filter((item) => category === "all" || item.category === category);
  const unread = items.filter((item) => !seen.includes(item.revision)).length;
  function markRead(revisions: string[]) {
    setSeen((current) => {
      const next = [...new Set([...current, ...revisions])].slice(-500);
      try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* Read state remains available in this tab. */ }
      return next;
    });
  }
  async function finishIntroduction(enable:boolean){
    if(introBusy)return;
    setIntroBusy(true);setIntroError("");
    try{
      await api('/notifications/onboarding','POST',{enable});
      setIntroDone(true);
      await onPreferenceSaved?.();
    }catch{setIntroError("Your choice could not be saved. Please try again.");}
    finally{setIntroBusy(false);}
  }
  if(fullPage&&user.notification_intro_pending&&!introDone)return <div className="notification-onboarding" ref={root} aria-labelledby="notification-intro-title">
    <span className="notification-intro-symbol" aria-hidden="true"><Bell size={27}/></span>
    <h2 id="notification-intro-title">Get notified about<br/>important updates</h2>
    <p className="notification-intro-description">Stay connected to your vehicle and your TODA.</p>
    <h3>We’ll notify you when</h3>
    <ul className="notification-intro-benefits">
      <li><Shield size={20} aria-hidden="true"/><span>A vehicle security alert is recorded</span></li>
      <li><Sun size={20} aria-hidden="true"/><span>New harvested energy is recorded</span></li>
      <li><Radio size={20} aria-hidden="true"/><span>Your device has a status update</span></li>
      <li><LifeBuoy size={20} aria-hidden="true"/><span>Your TODA responds to an assistance request</span></li>
    </ul>
    <div className="notification-intro-actions"><p>You can change this in Settings later.</p><small>These are in-app updates. SMS is managed separately.</small>{introError&&<p role="alert">{introError}</p>}<div><button disabled={introBusy} onClick={()=>void finishIntroduction(false)}>Later</button><button className="primary" disabled={introBusy} onClick={()=>void finishIntroduction(true)}>{introBusy?'Saving…':'Get notified'}</button></div></div>
  </div>;
  return <div className={fullPage ? "panel notification-page" : "notification-menu"} ref={root}>
    {!fullPage && <button ref={trigger} className="notification-trigger" aria-label={`Open notifications${user.notifications && unread ? `, ${unread} unread` : ""}`} aria-expanded={open} aria-controls="notification-feed" aria-haspopup="dialog" onClick={() => setOpen(!open)}>
      <Bell size={20} />{user.notifications && unread > 0 ? <span className="notification-count">{unread > 9 ? "9+" : unread}</span> : null}
    </button>}
    {(fullPage || open) && <div id="notification-feed" className={fullPage ? "notification-page-feed" : "notification-dropdown"} role={fullPage ? "region" : "dialog"} aria-label="Notifications">
      <div className="notification-heading"><div><h2 className={fullPage?"notification-inbox-heading":undefined}>{fullPage ? "Your inbox" : "Notifications"}</h2><p>{mode === "demo" ? "Demonstration · simulated activity" : "Recorded hardware & system activity"}</p></div>{fullPage && <button className="notification-settings" aria-label="Notification settings" onClick={() => go("Settings")}><Settings size={19} aria-hidden="true"/></button>}{!fullPage && <button ref={close} aria-label="Close notifications" onClick={() => { setOpen(false); trigger.current?.focus(); }}><X size={18} /></button>}</div>
      <div className="notification-tools"><label>Show<select aria-label="Notification category" value={category} onChange={(event) => setCategory(event.target.value)}><option value="all">All activity</option><option value="security">Security</option><option value="alert">Alerts</option><option value="energy">Harvested energy</option><option value="system">System updates</option><option value="assistance">Assistance</option><option value="message">Messages</option></select></label><button disabled={!unread} onClick={() => markRead(items.map((item) => item.revision))}><CheckCheck size={15} />Mark all read</button></div>
      {!user.notifications && <p className="notification-hint">Notification badges are off in your profile. Activity is still available here.</p>}
      {error && <div className="notification-error" role="status"><p>{error}</p><button onClick={() => { setLoading(true); setRetry((value) => value + 1); }}>Retry</button></div>}
      {fullPage && !loading && visibleItems.length>0 && <div className="notification-section-label"><span>Recent notifications</span><span>{visibleItems.length} update{visibleItems.length===1?"":"s"}</span></div>}
      <div className="notification-list">
        {loading && <p className="notification-empty">Loading activity…</p>}
        {!loading && !visibleItems.length && <div className="notification-empty">{fullPage?<div className="notification-mailbox" aria-hidden="true"><span className="notification-mailbox-halo"/><Mailbox size={70} strokeWidth={1.5}/><span className="notification-mailbox-check"><Check size={20}/></span></div>:<Bell size={25} />}<strong>{fullPage?(category==="all"?"No notifications yet":"No updates in this category"):"No recorded updates"}</strong><p>{category === "energy" ? "Harvested-energy updates appear when positive energy increments are recorded." : "New activity will appear here as SOLAIR receives it."}</p></div>}
        {visibleItems.map((item) => {
          const Icon = icons[item.category];
          return <button key={item.id} className={`notification-item ${seen.includes(item.revision) ? "read" : "unread"}`} onClick={() => { markRead([item.revision]); if (item.vehicle_id) select(item.vehicle_id); go(item.page); setOpen(false); }}>
            <span className={`notification-icon ${item.category}`}><Icon size={18} aria-hidden="true"/></span>
            <span className="notification-content">{fullPage&&<span className="notification-item-meta"><span>{item.category=== "energy"?"Energy":item.category=== "assistance"?"Assistance":item.category=== "security"?"Security":item.category=== "alert"?"Alert":item.category=== "message"?"Message":"System"}</span><time dateTime={item.created_at}>{stamp(item.created_at)}</time></span>}<strong>{item.title}</strong><span>{item.body}</span><small>{!fullPage&&`${stamp(item.created_at)} · `}{item.source === "demo" ? "SIMULATED" : item.source === "hardware" ? "HARDWARE" : "SYSTEM"}</small></span>
            {!seen.includes(item.revision) && <span className="notification-unread-dot" aria-label="Unread" />}
          </button>;
        })}
      </div>
      {fullPage?<div className="notification-history"><p>Looking for earlier activity?</p><button onClick={() => go("History & Reports")}>View history &amp; reports <ArrowUpRight size={15} aria-hidden="true"/></button><small>Reading a notification does not acknowledge a security incident.</small></div>:<p className="notification-footer">Recent activity · Reading a notification does not acknowledge a security incident.</p>}
    </div>}
  </div>;
}
