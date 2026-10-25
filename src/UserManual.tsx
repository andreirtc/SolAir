import {useEffect,useRef,useState} from 'react';
import {ArrowUpRight,BookOpen,Download,X} from 'lucide-react';
import manual from './content/solair-user-manual.json';

export default function UserManual(){
 const dialog=useRef<HTMLDialogElement>(null),trigger=useRef<HTMLButtonElement>(null);
 const [open,setOpen]=useState(false);
 useEffect(()=>{
  if(!open)return;const previous=document.body.style.overflow;document.body.style.overflow='hidden';
  return()=>{document.body.style.overflow=previous;};
 },[open]);
 function launch(){dialog.current?.showModal();dialog.current?.querySelector('.manual-dialog-body')?.scrollTo(0,0);setOpen(true);}
 return <>
  <button ref={trigger} className="help-manual-trigger" aria-haspopup="dialog" onClick={launch}><span className="help-manual-icon"><BookOpen size={23} aria-hidden="true"/></span><span><strong>User manual</strong><small>Read the guide or save a PDF copy</small></span><ArrowUpRight size={18} aria-hidden="true"/></button>
  <dialog ref={dialog} className="user-manual-dialog" aria-labelledby="manual-dialog-title" onKeyDown={event=>{
   if(event.key!=='Tab')return;
   const controls=Array.from(event.currentTarget.querySelectorAll<HTMLElement>('button:not([disabled]),a[href],[tabindex="0"]'));
   const first=controls[0],last=controls.at(-1);
   if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}
   else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}
  }} onClose={()=>{setOpen(false);trigger.current?.focus();}} onClick={e=>{if(e.target===e.currentTarget)dialog.current?.close();}}>
   <header><div><span className="eyebrow">SOLAIR GUIDE</span><h2 id="manual-dialog-title">User manual</h2></div><div><a className="button manual-download" href="/downloads/SOLAIR-user-manual.pdf" download="SOLAIR-user-manual.pdf"><Download size={16} aria-hidden="true"/>Download PDF</a><button autoFocus className="manual-close" aria-label="Close user manual" onClick={()=>dialog.current?.close()}><X size={20} aria-hidden="true"/></button></div></header>
   <div className="manual-dialog-body" tabIndex={0}>
    <div className="manual-intro"><h3>{manual.subtitle}</h3><p>{manual.introduction}</p><small>Version {manual.version} · Updated {manual.updated}</small></div>
    <nav className="manual-contents" aria-label="Manual contents"><h3>In this guide</h3>{manual.sections.map((section,index)=><a key={section.id} href={`#manual-${section.id}`}><span>{String(index+1).padStart(2,'0')}</span>{section.title}</a>)}</nav>
    {manual.sections.map((section,index)=><section className="manual-chapter" key={section.id} id={`manual-${section.id}`} aria-labelledby={`manual-heading-${section.id}`}><span className="eyebrow">CHAPTER {String(index+1).padStart(2,'0')}</span><h3 id={`manual-heading-${section.id}`}>{section.title}</h3><p>{section.summary}</p><ol>{section.steps.map(step=><li key={step.title}><h4>{step.title}</h4><p>{step.text}</p></li>)}</ol><div className="manual-notes">{section.notes.map(note=><div key={note.title}><strong>{note.title}</strong><p>{note.text}</p></div>)}</div></section>)}
   </div>
  </dialog>
 </>;
}
