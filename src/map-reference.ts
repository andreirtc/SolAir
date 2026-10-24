import type {Vehicle} from './types';

// Reference views only. These coordinates never become a vehicle GPS reading.
const MANILA={city:'Manila',center:[14.5995,120.9842] as [number,number],zoom:14};
const MALABON={city:'Malabon',center:[14.668,120.965] as [number,number],zoom:14};
const METRO_MANILA={city:'Metro Manila',center:[14.5995,120.9842] as [number,number],zoom:12};
export function vehicleMapReference(vehicle?:Pick<Vehicle,'model'>){
 const model=vehicle?.model.trim().toUpperCase()||'';
 if(model.startsWith('BEMAC'))return MANILA;
 if(model.startsWith('NWOW'))return MALABON;
 return METRO_MANILA;
}
export function hasMapPosition(vehicle:Vehicle):vehicle is Vehicle&{gps:NonNullable<Vehicle['gps']>}{
 return !!vehicle.gps&&Number.isFinite(vehicle.gps.latitude)&&Math.abs(vehicle.gps.latitude)<=90&&Number.isFinite(vehicle.gps.longitude)&&Math.abs(vehicle.gps.longitude)<=180;
}
