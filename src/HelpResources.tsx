import {Bug,ChevronRight,CircleHelp,Download,FileClock,FileText,Keyboard,ShieldCheck} from 'lucide-react';

export default function HelpResources({go}:{go:(page:string,target?:string)=>void}){
 return <section className="panel help-resources" aria-label="Help and information">
  <h3>Help and information</h3>
  <nav aria-label="Help resources">
   <button className="help-resource-row" onClick={()=>go('Help and support')}><CircleHelp size={20} aria-hidden="true"/><span>Help center</span><ChevronRight size={18} aria-hidden="true"/></button>
   <button className="help-resource-row" onClick={()=>go('Settings','alert-contact')}><ShieldCheck size={20} aria-hidden="true"/><span>Privacy center<small>Manage your contact details and SMS consent</small></span><ChevronRight size={18} aria-hidden="true"/></button>
   <details><summary className="help-resource-row"><FileClock size={20} aria-hidden="true"/><span>Release notes</span><ChevronRight size={18} aria-hidden="true"/></summary><div className="help-resource-content"><strong>Latest interface updates</strong><ul><li>A simpler driver Overview with quick actions.</li><li>Account setup and registration details in Settings.</li><li>Page retention after refresh.</li><li>Improved mobile scrolling and +63 number entry.</li></ul></div></details>
   <details><summary className="help-resource-row"><Download size={20} aria-hidden="true"/><span>Download apps</span><ChevronRight size={18} aria-hidden="true"/></summary><div className="help-resource-content"><p>SOLAIR is a web app. Check your browser menu for an installation option if supported. You can keep using SOLAIR in your browser.</p><p>A separate Android or iOS download is not provided here.</p></div></details>
   <details className="help-keyboard-shortcuts"><summary className="help-resource-row"><Keyboard size={20} aria-hidden="true"/><span>Keyboard shortcuts</span><ChevronRight size={18} aria-hidden="true"/></summary><div className="help-resource-content"><dl><div><dt><kbd>Tab</kbd> / <kbd>Shift</kbd> + <kbd>Tab</kbd></dt><dd>Move between controls.</dd></div><div><dt><kbd>Enter</kbd> / <kbd>Space</kbd></dt><dd>Activate a focused button.</dd></div><div><dt><kbd>Esc</kbd></dt><dd>Close the account menu, TODA popup or navigation drawer.</dd></div></dl></div></details>
   <div className="help-resource-legal"><button className="help-resource-row" onClick={()=>go('Terms of Service')}><FileText size={20} aria-hidden="true"/><span>Terms of Service<small>Draft for review</small></span></button><button className="help-resource-row" onClick={()=>go('Privacy Policy')}><ShieldCheck size={20} aria-hidden="true"/><span>Privacy Policy<small>Draft for review</small></span></button></div>
   <button className="help-resource-row" onClick={()=>go('Report a problem')}><Bug size={20} aria-hidden="true"/><span>Report a bug</span><ChevronRight size={18} aria-hidden="true"/></button>
  </nav>
 </section>;
}
