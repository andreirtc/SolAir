import {useEffect,useId,useRef,useState} from 'react';
import {ShieldAlert,Trash2,UserCheck,UserX} from 'lucide-react';
import {api} from './api';

export default function AccountAccess({person,onChange}:{person:{id:string;name:string;email:string;active?:boolean;deletion_pending?:boolean};onChange:(message:string)=>Promise<void>}){
 const [action,setAction]=useState<'deactivate'|'reactivate'|'delete'|null>(null),[email,setEmail]=useState(''),[reason,setReason]=useState(''),[busy,setBusy]=useState(false),[error,setError]=useState('');
 const pending=useRef(false),dialog=useRef<HTMLDialogElement>(null),returnFocus=useRef<HTMLElement|null>(null),title=useId();
 const active=person.active!==false;
 useEffect(()=>{if(action){returnFocus.current=document.activeElement as HTMLElement;dialog.current?.showModal();}else if(dialog.current?.open){dialog.current.close();returnFocus.current?.focus();}},[action]);
 function close(){if(busy||pending.current)return;setAction(null);setEmail('');setReason('');setError('');}
 const verb=action==='delete'?'Permanently delete':action==='reactivate'?'Reactivate':'Deactivate';
 return <section className="account-access" aria-label={'Account access for '+person.name}>
  <div><h4><ShieldAlert size={18} aria-hidden="true"/>Account access</h4><p>{person.deletion_pending?'Deletion is pending. This account cannot sign in or be reactivated; retry deletion to finish.':active?'Deactivation ends sign-in access and removes active assignments while keeping saved history. Permanent deletion becomes available afterward for accounts without operational history.':'This account is deactivated. Reactivation does not restore its previous vehicle or operator assignments.'}</p></div>
  <div className="button-row">
   {!person.deletion_pending&&<button type="button" disabled={busy} className={active?'danger-outline':''} onClick={()=>setAction(active?'deactivate':'reactivate')}>{active?<UserX size={17}/>:<UserCheck size={17}/>} {active?'Deactivate account':'Reactivate account'}</button>}
   {!active&&<button type="button" disabled={busy} className="danger-outline" onClick={()=>setAction('delete')}><Trash2 size={17}/> {person.deletion_pending?'Retry permanent deletion':'Permanently delete account'}</button>}
  </div>
  <dialog ref={dialog} className="account-confirmation" aria-labelledby={title} onCancel={event=>{event.preventDefault();close();}}>
   <h2 id={title}>{verb} account?</h2>
   <p><strong>{person.name}</strong><br/>{person.email}</p>
   <p>{action==='delete'?'This permanently removes the sign-in profile and account preferences. It cannot be undone. Accounts with saved operational history cannot be permanently deleted; their history and administrative activity remain protected.':action==='reactivate'?'The person can sign in again. Review vehicle, operator and device assignments separately.':'This ends all active sessions and removes active driver/operator assignments. Saved messages, alerts and other history stay available.'}</p>
   <form onSubmit={async event=>{event.preventDefault();if(!action||pending.current)return;pending.current=true;setBusy(true);setError('');try{const result=await api('/admin/people/'+encodeURIComponent(person.id)+(action==='delete'?'':'/status'),action==='delete'?'DELETE':'POST',{confirmation_email:email.trim(),reason,...(action==='delete'?{}:{active:action==='reactivate'})});setAction(null);setEmail('');setReason('');await onChange(result.message);}catch(cause){const message=(cause as Error).message;if(action==='delete'&&(cause as {status?:number}).status===502){setAction(null);await onChange(message);}else setError(message);}finally{pending.current=false;setBusy(false);}}}>
    <label>Type the account email to confirm<input type="email" autoComplete="off" value={email} onChange={event=>setEmail(event.target.value)} required disabled={busy}/></label>
    <label>Reason<textarea value={reason} onChange={event=>setReason(event.target.value)} minLength={5} maxLength={500} required disabled={busy}/></label>
    {error&&<p className="error" role="alert">{error}</p>}
    <div className="button-row"><button type="submit" className={action==='reactivate'?'primary':'danger-action'} disabled={busy||email.trim().toLowerCase()!==person.email.toLowerCase()||reason.trim().length<5} aria-busy={busy}>{busy?'Saving…':verb+' account'}</button><button type="button" disabled={busy} onClick={close}>Cancel</button></div>
   </form>
  </dialog>
 </section>;
}
