import {createClient} from '@supabase/supabase-js';
import type {Store} from './db';
export function startSupabaseRealtime(db:Store,notify:(org:string)=>void,status:(state:string)=>void){
 if(process.env.SOLAIR_REALTIME_PROVIDER!=='supabase'){status('local');return async()=>{};}
 const url=process.env.SUPABASE_URL,key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Supabase realtime requires SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
 const client=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
 const onChange=async(payload:any)=>{const row=payload.new;if(!row)return;if(row.org_id){notify(row.org_id);return;}if(row.device_id){const [d]=await db.query('SELECT v.org_id FROM devices d JOIN vehicles v ON v.id=d.vehicle_id WHERE d.id=?',[row.device_id]);if(d)notify(d.org_id);}};
 status('connecting');const channel=client.channel('solair-server-changes');
 for(const table of ['telemetry','security_events','help_requests','messages'])channel.on('postgres_changes',{event:'*',schema:'public',table},payload=>{void onChange(payload).catch(()=>status('error'));});
 channel.subscribe(state=>status(state==='SUBSCRIBED'?'subscribed':state==='CHANNEL_ERROR'||state==='TIMED_OUT'?'error':'connecting'));
 return async()=>{await client.removeChannel(channel);};
}
