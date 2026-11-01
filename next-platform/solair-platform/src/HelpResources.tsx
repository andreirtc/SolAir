import {useState} from 'react';
import {Bug,ChevronRight,FileClock,FileText,Keyboard,MessageSquare,Plus,Search,ShieldCheck,X} from 'lucide-react';
import UserManual from './UserManual';
import {helpTopics} from './help-topics';

export default function HelpResources({go}:{go:(page:string,target?:string)=>void}){
 const [query,setQuery]=useState(''),search=query.trim().toLocaleLowerCase('en');
 const topics=helpTopics.filter(topic=>!search||[topic.question,...topic.answer].join(' ').toLocaleLowerCase('en').includes(search));
 return <section className="help-center" aria-label="Help and support center">
  <header className="help-center-intro"><span className="eyebrow">HERE FOR YOUR EVERYDAY JOURNEY</span><h2>We’re here to help you<br/>get moving.</h2><p>Find a quick answer, explore the user manual, or reach your TODA. Search a topic below to get started.</p></header>
  <div className="help-center-layout"><div className="help-faq-column">
   <div className="help-search"><Search size={19} aria-hidden="true"/><input type="search" aria-label="Search help" placeholder="Search help" value={query} onChange={event=>setQuery(event.target.value)}/>{query&&<button aria-label="Clear help search" onClick={()=>setQuery('')}><X size={17} aria-hidden="true"/></button>}</div>
   <div className="help-faq-heading"><h3>Frequently asked questions</h3><span role="status" aria-live="polite">{search?`${topics.length} result${topics.length===1?'':'s'}`:''}</span></div>
   <div className="help-faq-card">{topics.length?topics.map(topic=><details className="help-faq setup-destination" key={topic.id} id={topic.id} tabIndex={-1}><summary><span>{topic.question}</span><Plus size={17} aria-hidden="true"/></summary><div className="help-faq-answer">{topic.answer.map(answer=><p key={answer}>{answer}</p>)}{topic.action&&<button onClick={()=>go(topic.action!.page,topic.action!.target)}>{topic.action.label}<ChevronRight size={16} aria-hidden="true"/></button>}</div></details>):<div className="help-search-empty"><strong>No matching help topics</strong><p>Try a keyword such as GPS, energy, registration or notifications.</p><button onClick={()=>setQuery('')}>Show all topics</button></div>}</div>
  </div><aside className="help-center-aside" aria-label="Manual and support resources">
   <UserManual/>
   <section className="help-contact-card"><span className="help-contact-icon"><MessageSquare size={23} aria-hidden="true"/></span><h3>Still need a hand?</h3><p>Send your concern through your assigned vehicle’s TODA conversation, or report an issue with the app.</p><button className="primary" onClick={()=>go('Messages')}><MessageSquare size={16} aria-hidden="true"/>Send a message</button><button className="help-report-link" onClick={()=>go('Report a problem')}><Bug size={16} aria-hidden="true"/>Report a problem</button></section>
   <div className="help-extra-resources">
    <details><summary><FileClock size={17} aria-hidden="true"/><span>What’s new</span><Plus size={16} aria-hidden="true"/></summary><p>Grouped Settings pages, registration shortcuts, profile photos, recorded energy line graphs, Location History and page retention after refresh are available in this interface.</p></details>
    <details><summary><Keyboard size={17} aria-hidden="true"/><span>Keyboard shortcuts</span><Plus size={16} aria-hidden="true"/></summary><p>Tab / Shift+Tab: move between controls. Enter / Space: activate buttons. Escape: close the manual popup and supported menus.</p></details>
    <button onClick={()=>go('Contact & SMS preferences')}><ShieldCheck size={17} aria-hidden="true"/>Privacy and alert contact<ChevronRight size={16} aria-hidden="true"/></button>
    <button onClick={()=>go('Terms of Service')}><FileText size={17} aria-hidden="true"/>Terms of Service<small>Draft</small></button>
    <button onClick={()=>go('Privacy Policy')}><ShieldCheck size={17} aria-hidden="true"/>Privacy Policy<small>Draft</small></button>
   </div>
  </aside></div>
 </section>;
}
