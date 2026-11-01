import type {Vehicle} from './types';
import {gpsUsableForMap,GPS_MAP_LIVE_WINDOW_MS} from '../packages/telemetry-contract/gps';

// Reference views only. These coordinates never become a vehicle GPS reading.
const MANILA={city:'Manila',center:[14.5995,120.9842] as [number,number],zoom:14};
const MALABON={city:'Malabon',center:[14.668,120.965] as [number,number],zoom:14};
const METRO_MANILA={city:'Metro Manila',center:[14.5995,120.9842] as [number,number],zoom:12};
export function vehicleMapReference(vehicle?:Pick<Vehicle,'model'>){
 const model=vehicle?.model?.trim().toUpperCase()||'';
 if(model.startsWith('BEMAC'))return MANILA;
 if(model.startsWith('NWOW'))return MALABON;
 return METRO_MANILA;
}
export function hasMapPosition(vehicle:Vehicle):vehicle is Vehicle&{gps:NonNullable<Vehicle['gps']>}{
 return !!vehicle.gps&&Number.isFinite(vehicle.gps.latitude)&&Math.abs(vehicle.gps.latitude)<=90&&Number.isFinite(vehicle.gps.longitude)&&Math.abs(vehicle.gps.longitude)<=180;
}

// The backend's GPS field is a retained reliable position. It can be shown as
// last known even when a later raw receiver sample has lost its fix/quality.
export function hasFreshMapPosition(vehicle:Vehicle,now=Date.now()) {
 const t=vehicle.telemetry;
 if(!hasMapPosition(vehicle)||!t||t.cpe?.historical||!gpsUsableForMap(t))return false;
 const captured=Date.parse(t.device_timestamp||''),measured=Date.parse(t.measured_at),received=Date.parse(t.received_at),positionAt=Date.parse(vehicle.gps.measured_at);
 if(![captured,measured,received,positionAt].every(at=>Number.isFinite(at)&&at<=now))return false;
 return t.gps_fix_age_ms!+Math.max(now-captured,now-measured,now-received)<=GPS_MAP_LIVE_WINDOW_MS&&now-positionAt<=GPS_MAP_LIVE_WINDOW_MS;
}
