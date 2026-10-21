import {ArrowUpRight,MapPin,Shield,LifeBuoy,Users,FlaskConical} from 'lucide-react';
import type {Profile} from './types';
import type {ReactNode} from 'react';

export function ReadingDetails({compact,children}:{compact:boolean;children:ReactNode}){
 return compact?<details className="measurement-banner"><summary>About these readings</summary>{children}</details>:<div className="measurement-banner">{children}</div>;
}

export default function WorkspaceGuide({user,go}:{user:Profile;go:(page:string)=>void}){
 const driver=user.role==='driver',engineer=user.role==='engineer';
 const actions=driver?[
  {page:'Live Fleet Map',title:'Find my vehicle',detail:'View its last reported location',Icon:MapPin},
  {page:'Security',title:'Check my alerts',detail:'See what needs your attention',Icon:Shield},
  {page:'SOS & Assistance',title:'Ask my TODA for help',detail:'Send an assistance request',Icon:LifeBuoy},
 ]:engineer?[
  {page:'CPE Lab',title:'Open CPE Lab',detail:'Inspect device readings and evidence',Icon:FlaskConical},
  {page:'Security',title:'Review device incidents',detail:'Investigate reported events',Icon:Shield},
 ]:[
  {page:'Live Fleet Map',title:'Locate the fleet',detail:'View vehicles in your TODA',Icon:MapPin},
  {page:'Security',title:'Review alerts',detail:'Acknowledge and follow up',Icon:Shield},
  {page:'SOS & Assistance',title:'Help a driver',detail:'Review assistance requests',Icon:Users},
 ];
 return <section className="workspace-guide" aria-label="Quick actions"><div className="guide-caption"><span className="eyebrow">{driver?'A LITTLE HELP FOR YOUR DAY':engineer?'YOUR ENGINEERING WORKSPACE':'KEEP YOUR TODA MOVING'}</span><p>{driver?'Your vehicle, your alerts, your peace of mind.':engineer?'Readings first. Evidence always.':'Start with the people and vehicles that need you.'}</p></div><div className="quick-actions">{actions.map(({page,title,detail,Icon})=><button key={page} aria-label={title} onClick={()=>go(page)}><span className="quick-action-icon"><Icon size={22}/></span><span><strong className="quick-full-title">{title}</strong><strong className="quick-short-title">{page==='Live Fleet Map'?'Location':page==='Security'?'Alerts':'Get help'}</strong><small>{detail}</small></span><ArrowUpRight className="quick-action-arrow" size={18}/></button>)}</div></section>;
}
