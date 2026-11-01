'use client';
import {useEffect,useState} from 'react';
import {api} from './api';
import {VehicleVisualization} from './VehicleVisualization';
import Brand from './Brand';
export default function PasswordRecovery(){
 const [tokens]=useState(()=>{const hash=new URLSearchParams(location.hash.slice(1));return {access_token:hash.get('access_token')||'',refresh_token:hash.get('refresh_token')||''};});
 const [password,setPassword]=useState(''),[message,setMessage]=useState(''),[done,setDone]=useState(false);
 useEffect(()=>{history.replaceState({},'', '/reset-password');},[]);
 return <main className="login login-entry"><section className="login-art"><Brand/><p>Secure access to connected mobility.</p><VehicleVisualization/></section><section className="login-form"><div className="mobile-auth-brand"><Brand/></div><h2>Reset your password</h2><p>{tokens.access_token?'Choose a new password of at least 12 characters.':'Open the recovery link from your Supabase email to continue.'}</p><form onSubmit={async e=>{e.preventDefault();try{await api('/password/recover','POST',{...tokens,password});setDone(true);setMessage('Password updated. Existing SOLAIR sessions were revoked.');}catch(e){setMessage((e as Error).message);}}}><label>New password<input type="password" minLength={12} maxLength={200} required value={password} onChange={e=>setPassword(e.target.value)}/></label><button className="primary" disabled={!tokens.access_token||done}>Update password</button></form>{message&&<p role="status">{message}</p>}<a className="button" href="/">Back to sign in</a></section></main>;
}
