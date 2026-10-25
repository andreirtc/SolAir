import {useRef,useState} from 'react';
import {Camera,Trash2} from 'lucide-react';
import {api} from './api';
import {acceptsPhotoName,photoMime} from '../packages/profile-photo-format';
import type {Profile} from './types';
import ProfileAvatar from './ProfileAvatar';
type Choice={filename:string;mime:string;dataUrl:string;base64:string};
export default function ProfilePhotoEditor({user,onSaved}:{user:Profile;onSaved:()=>Promise<void>}){
 const [choice,setChoice]=useState<Choice|null>(null),[busy,setBusy]=useState(false),[reading,setReading]=useState(false),[error,setError]=useState(''),[message,setMessage]=useState('');
 const input=useRef<HTMLInputElement>(null);
 async function choose(file:File|undefined){
  setChoice(null);setError('');setMessage('');if(!file)return;
  if(!/\.(png|img)$/i.test(file.name)||file.size>3000000||!file.size){setError('Choose a PNG or IMG photo up to 3 MB.');return;}
  setReading(true);
  try{
   const mime=photoMime(new Uint8Array(await file.slice(0,16).arrayBuffer()));
   if(!mime||!acceptsPhotoName(file.name,mime)){setReading(false);setError('This file does not contain a supported image. Choose a readable PNG or IMG photo.');return;}
   const reader=new FileReader();
   reader.onerror=()=>{setReading(false);setError('This photo could not be read. Try another image.');};
   reader.onload=()=>{
    const dataUrl=String(reader.result),image=new window.Image();
    image.onload=()=>{setChoice({filename:file.name,mime,dataUrl,base64:dataUrl.slice(dataUrl.indexOf(',')+1)});setReading(false);};
    image.onerror=()=>{setReading(false);setError('This file is not a readable image. Try another photo.');};
    image.src=dataUrl;
   };
   reader.readAsDataURL(new Blob([file],{type:mime}));
  }catch{setReading(false);setError('This photo could not be read. Try another image.');}
 }
 async function save(remove=false){
  if(busy||reading||(!remove&&!choice))return;
  setBusy(true);setError('');setMessage('');
  try{await api('/profile-photo',remove?'DELETE':'POST',remove?undefined:{filename:choice!.filename,mime:choice!.mime,base64:choice!.base64});await onSaved();setChoice(null);if(input.current)input.current.value='';setMessage(remove?'Profile photo removed.':'Profile photo saved.');}
  catch{setError('Your photo could not be saved. Please try again.');}
  finally{setBusy(false);}
 }
 return <section className="profile-photo-editor" aria-labelledby="profile-photo-heading">
  <div className="profile-photo-heading"><ProfileAvatar user={{...user,avatar_url:choice?.dataUrl||user.avatar_url}} className="profile-photo-preview" label="Profile photo preview"/><div><h4 id="profile-photo-heading">Profile photo</h4><p>Add a photo so your profile is easy to recognize.</p><small>PNG or IMG · up to 3 MB</small></div></div>
  <label>Choose profile photo<input ref={input} type="file" accept=".img,.png" disabled={busy||reading} onChange={e=>void choose(e.target.files?.[0])}/></label>
  <div className="profile-photo-actions"><button className="primary" disabled={!choice||busy||reading} onClick={()=>void save()}><Camera size={16} aria-hidden="true"/>{busy?'Saving…':'Save photo'}</button>{(user.avatar_url||choice)&&<button disabled={busy||reading} onClick={()=>{if(choice){setChoice(null);if(input.current)input.current.value='';}else void save(true);}}><Trash2 size={16} aria-hidden="true"/>{choice?'Cancel selection':'Remove photo'}</button>}</div>
  {reading&&<p role="status">Preparing photo preview…</p>}{error&&<p role="alert">{error}</p>}{message&&<p role="status">{message}</p>}
 </section>;
}
