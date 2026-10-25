import type {Express,Request,RequestHandler} from 'express';
import {z} from 'zod';
import {acceptsPhotoName,photoMime} from '../packages/profile-photo-format';
import type {Store} from './db';
import type {User} from './auth';
const schema=z.object({filename:z.string().min(1).max(255),mime:z.enum(['image/png','image/jpeg','image/webp']),base64:z.string().min(1).max(4000000)}).strict();
export function decodeProfilePhoto(value:unknown){
 const photo=schema.parse(value),bytes=Buffer.from(photo.base64,'base64');
 const valid=photo.mime==='image/png'?bytes.length>=33&&bytes.subarray(0,8).toString('hex')==='89504e470d0a1a0a'&&bytes.subarray(12,16).toString()==='IHDR':photo.mime==='image/jpeg'?bytes.length>=20&&bytes.subarray(0,3).toString('hex')==='ffd8ff':bytes.length>=20&&bytes.subarray(0,4).toString()==='RIFF'&&bytes.subarray(8,12).toString()==='WEBP';
 if(!valid||photoMime(bytes)!==photo.mime||!acceptsPhotoName(photo.filename,photo.mime)||bytes.length>3000000||bytes.toString('base64')!==photo.base64)throw new Error('Use a readable .png or .img photo up to 3 MB.');
 return {...photo,bytes};
}
export function profilePhotoRoutes(app:Express,db:Store,auth:RequestHandler){
 const user=(req:Request)=>(req as Request&{user:User}).user;
 app.post('/api/profile-photo',auth,async(req,res)=>{
  let photo:ReturnType<typeof decodeProfilePhoto>;
  try{photo=decodeProfilePhoto(req.body);}catch{return res.status(400).json({error:'Use a readable .png or .img photo up to 3 MB.'});}
  const u=user(req),at=new Date().toISOString();
  await db.run('INSERT INTO profile_photos(user_id,mime,base64,updated_at) VALUES (?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET mime=excluded.mime,base64=excluded.base64,updated_at=excluded.updated_at',[u.id,photo.mime,photo.base64,at]);
  res.json({ok:true,avatar_url:'/api/profile-photo?v='+encodeURIComponent(at)});
 });
 app.get('/api/profile-photo',auth,async(req,res)=>{
  const [photo]=await db.query('SELECT mime,base64 FROM profile_photos WHERE user_id=?',[user(req).id]);
  if(!photo)return res.status(404).json({error:'No profile photo saved.'});
  res.set('Cache-Control','private, no-store').type(photo.mime).send(Buffer.from(photo.base64,'base64'));
 });
 app.delete('/api/profile-photo',auth,async(req,res)=>{
  await db.run('DELETE FROM profile_photos WHERE user_id=?',[user(req).id]);
  res.json({ok:true,avatar_url:null});
 });
}
