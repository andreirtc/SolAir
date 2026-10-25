import {useState} from 'react';
import Image from 'next/image';
import type {Profile} from './types';
export default function ProfileAvatar({user,className='avatar',label}:{user:Profile;className?:string;label?:string}){
 const [failed,setFailed]=useState<string|null>(null);
 const initials=user.name.trim().split(/\s+/).slice(0,2).map(part=>part[0]).join('').toUpperCase();
 return <span className={`${className} profile-avatar`} aria-hidden={label?undefined:true} role={label?'img':undefined} aria-label={label}>
  {user.avatar_url&&failed!==user.avatar_url?<Image src={user.avatar_url} width={96} height={96} alt="" unoptimized onError={()=>setFailed(user.avatar_url||null)}/>:initials}
 </span>;
}
