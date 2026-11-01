import {useEffect,useRef} from 'react';
import {ArrowLeft,FileText,ShieldCheck} from 'lucide-react';

import copy from './content/solair-policies.json';
type Section={title:string;text:string[]};
export const policyDrafts:Record<string,{intro:string;sections:Section[];review:string[]}>=copy.policies;

export default function PolicyDraft({title,go}:{title:string;go:(page:string)=>void}){
 const heading=useRef<HTMLHeadingElement>(null),draft=policyDrafts[title];
 useEffect(()=>{heading.current?.focus({preventScroll:true});heading.current?.scrollIntoView({block:'start'});},[title]);
 if(!draft)return null;
 const Icon=title==='Privacy Policy'?ShieldCheck:FileText;
 return <article className="panel policy-draft" aria-label={title+' draft'}>
  <button onClick={()=>go('SOS & Assistance')}><ArrowLeft size={16} aria-hidden="true"/>Back to Help</button>
  <h2 ref={heading} tabIndex={-1}><Icon size={24} aria-hidden="true"/>{title}</h2>
  <p className="policy-draft-status"><strong>Draft for review</strong> · Version {copy.version} · Prepared {copy.prepared}</p>
  <p>{draft.intro}</p>
  <p className="policy-publication-note">Operator identity and the official service/privacy contact are not yet confirmed. This page remains marked Draft until those publication details are supplied.</p>
  <nav className="policy-contents" aria-label={title+' contents'}>{draft.sections.map((section,index)=><a key={section.title} href={'#policy-section-'+index}>{section.title}</a>)}</nav>
  {draft.sections.map((section,index)=><section key={section.title} id={'policy-section-'+index} tabIndex={-1}><h3>{section.title}</h3>{section.text.map(text=><p key={text}>{text}</p>)}</section>)}
  <section className="policy-review"><h3>Publication details still needed</h3><ul>{draft.review.map(item=><li key={item}>{item}</li>)}</ul></section>
  {title==='Privacy Policy'&&<p className="subtle">Review reference: <a href="https://privacy.gov.ph/the-right-to-be-informed/" target="_blank" rel="noopener noreferrer">National Privacy Commission — the right to be informed</a>. This reference does not establish approval or compliance.</p>}
  <div className="button-row"><button onClick={()=>go(title==='Privacy Policy'?'Terms of Service':'Privacy Policy')}>Read {title==='Privacy Policy'?'Terms of Service':'Privacy Policy'}</button><button onClick={()=>go('Settings')}>Open Settings</button></div>
 </article>;
}
