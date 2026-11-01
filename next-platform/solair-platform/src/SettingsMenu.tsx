import {ArrowLeft,Bell,ChevronRight,ClipboardList,FileText,Flag,LifeBuoy,Mail,Pencil,ShieldCheck,Smartphone,Sun,UserRound,type LucideIcon} from 'lucide-react';
import ProfileAvatar from './ProfileAvatar';
import type {Profile} from './types';
import {useAppearance} from './Theme';

type Item={label:string;page:string;icon:LucideIcon;value?:string};
export function SettingsBack({go}:{go:(page:string)=>void}){
 return <button className="settings-back" onClick={()=>go('Settings')}><ArrowLeft size={17} aria-hidden="true"/>Back to settings</button>;
}
export default function SettingsMenu({user,go}:{user:Profile;go:(page:string)=>void}){
 const appearance=useAppearance(),theme=appearance?.theme||'system';
 const groups:{title:string;items:Item[]}[]=[
  {title:'Account details',items:[{label:'Account profile',page:'Account profile',icon:UserRound},{label:'My registration and assignments',page:'My registration and assignments',icon:ClipboardList},{label:'Contact & SMS preferences',page:'Contact & SMS preferences',icon:Smartphone}]},
  {title:'General',items:[{label:'Notifications',page:'Notification preferences',icon:Bell,value:user.notifications?'On':'Off'},{label:'Light / Dark mode',page:'Appearance',icon:Sun,value:theme==='system'?'System':theme==='dark'?'Dark':'Light'},{label:'Account setup',page:'Account setup',icon:ShieldCheck}]},
  {title:'Support',items:[{label:'Help and support',page:'Help and support',icon:LifeBuoy},{label:'Report a problem',page:'Report a problem',icon:Flag},{label:'Terms of Service',page:'Terms of Service',icon:FileText},{label:'Privacy Policy',page:'Privacy Policy',icon:ShieldCheck}]}
 ];
 return <section className="settings-menu" aria-label="Settings menu">
  <div className="settings-profile-card"><ProfileAvatar user={user} className="settings-profile-avatar"/><div><h2>{user.name}</h2><p><Mail size={13} aria-hidden="true"/>{user.email}</p><button onClick={()=>go('Account profile')}><Pencil size={14} aria-hidden="true"/>Edit profile</button></div></div>
  <div className="settings-menu-groups">{groups.map(group=><section className="settings-menu-group" key={group.title} aria-label={group.title}><h3>{group.title}</h3><div className="settings-menu-card">{group.items.map(({label,page,icon:Icon,value})=><button key={page} onClick={()=>go(page)}><Icon size={21} aria-hidden="true"/><span>{label}</span>{value&&<small>{value}</small>}<ChevronRight size={18} aria-hidden="true"/></button>)}</div></section>)}</div>
 </section>;
}
