import type {Metadata,Viewport} from 'next';
export const metadata:Metadata={title:'SOLAIR · Connected mobility',description:'Energy intelligence, vehicle security and TODA fleet operations.',manifest:'/manifest.webmanifest',icons:{icon:'/icon.svg',apple:'/icon-192.png'}};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:[{media:'(prefers-color-scheme: light)',color:'#1959B5'},{media:'(prefers-color-scheme: dark)',color:'#12161D'}]};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="en-PH"><body>{children}</body></html>;}
