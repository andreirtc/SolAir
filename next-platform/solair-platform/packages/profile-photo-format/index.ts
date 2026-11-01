export type PhotoMime='image/png'|'image/jpeg'|'image/webp';
export function photoMime(bytes:Uint8Array):PhotoMime|null{
 if(bytes.length>=8&&[137,80,78,71,13,10,26,10].every((value,i)=>bytes[i]===value))return 'image/png';
 if(bytes.length>=3&&bytes[0]===255&&bytes[1]===216&&bytes[2]===255)return 'image/jpeg';
 if(bytes.length>=12&&String.fromCharCode(...bytes.slice(0,4))==='RIFF'&&String.fromCharCode(...bytes.slice(8,12))==='WEBP')return 'image/webp';
 return null;
}
export function acceptsPhotoName(name:string,mime:PhotoMime){
 return /\.img$/i.test(name)||(/\.png$/i.test(name)&&mime==='image/png');
}
