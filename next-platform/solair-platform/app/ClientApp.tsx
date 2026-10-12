'use client';
import dynamic from 'next/dynamic';
const Solair=dynamic(()=>import('../src/main'),{ssr:false,loading:()=> <div style={{padding:40,color:'#738292'}}>Connecting to SOLAIR…</div>});
export default function ClientApp(){return <Solair/>;}
