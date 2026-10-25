import Image from 'next/image';

export default function Brand(){
  return <div className="brand"><Image className="solair-wordmark" src="/solair-logo-transparent.png" width={1562} height={1007} alt="SolAir" unoptimized priority/></div>;
}
