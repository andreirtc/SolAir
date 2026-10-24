import type {ReactNode} from 'react';

export function EmptyState({title,children,icon}:{title:string;children:ReactNode;icon:ReactNode}){
 return <div className="workspace-empty"><span className="workspace-empty-icon" aria-hidden="true">{icon}</span><strong>{title}</strong><p>{children}</p></div>;
}

export function workspaceDescription(page:string,role:string){
 const driver=role==='driver';
 const descriptions:Record<string,string>={
  Overview:role==='admin'?'Accounts, TODAs, assignments and device readiness.':driver?'Your assigned vehicle and the next steps that need your attention.':'Monitor your TODA fleet and respond to drivers who need you.',
  'Live Fleet Map':driver?'Find your assigned vehicle using its last reported GPS location.':'Choose a vehicle to review its reported location and reference area.',
  Vehicles:'Review registered vehicles, their assignments and available readings.',
  Energy:driver?'Check available battery readings and recorded solar or wind energy.':'Compare recorded electrical readings and energy sources for the selected vehicle.',
  Security:driver?'Review reported alerts and the follow-up recorded by your TODA.':'Review incidents, acknowledge alerts and record your follow-up.',
  'SOS & Assistance':driver?'Tell your TODA what happened, then check for acknowledgment.':'Review driver requests and follow up within your TODA.',
  Messages:driver?'Contact authorized TODA personnel about your assigned vehicle.':'Follow up with the assigned driver in the selected vehicle conversation.',
  'History & Reports':'Review saved readings and export evidence for the selected vehicle and data mode.',
  Settings:'Manage your profile, registration details, appearance and alert contact.',
  'People & assignments':'Review registrations, approve account access and link drivers to the right vehicles.',
  Organizations:'Choose the TODA workspace whose fleet you want to manage.',
  Devices:'Review registered devices and their recorded approval evidence.',
  'Activity log':'Trace registrations, assignments and administrative changes across TODAs.',
  'CPE Lab':'Observe real hardware. Build reliable evidence.',
  'Help and support':'Find the next step for account setup, vehicle readings or TODA assistance.',
  'Report a problem':'Describe the issue so your administrator can investigate it.',
  'Terms of Service':'Review the proposed conditions for using SOLAIR. This draft awaits approval.',
  Notifications:'Review your recent activity and open an update to see its details.',
  'Privacy Policy':'Review how SOLAIR handles information and what needs confirmation before approval.',
 };
 return descriptions[page]||'Review the selected vehicle and its available records.';
}
