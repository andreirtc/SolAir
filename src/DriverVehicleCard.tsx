import {ArrowUpRight,MapPin,Truck} from 'lucide-react';
import {VehicleVisualization} from './VehicleVisualization';
import {vehicleMapReference,hasMapPosition} from './map-reference';
import type {Vehicle} from './types';
import {deviceHealth} from '../packages/device-health';
import DriverEnergySummary from './DriverEnergySummary';

export default function DriverVehicleCard({vehicle,organization,mode,go}:{vehicle:Vehicle;organization:string;mode:string;go:(page:string)=>void}){
 const reference=vehicleMapReference(vehicle),position=hasMapPosition(vehicle),connection=deviceHealth(vehicle.telemetry).connection;
 return <section className="panel driver-vehicle-summary journey-vehicle" aria-label="Your assigned vehicle">
  <div className="journey-vehicle-heading"><span className="eyebrow"><Truck size={14} aria-hidden="true"/>Your assigned vehicle · {vehicle.id}</span><span className={'badge'+(mode==='demo'?' amber':connection==='Recent contact'?' green':'')}>{mode==='demo'?'Simulated data':connection}</span></div>
  <div className="journey-vehicle-stage"><div className="journey-vehicle-copy"><h2>{vehicle.model}</h2><p>{organization}</p></div><VehicleVisualization vehicle={vehicle} compact/></div>
  <DriverEnergySummary vehicle={vehicle} mode={mode} go={go}/>
  <div className="journey-vehicle-footer"><span><MapPin size={15} aria-hidden="true"/>{position?'Last reported GPS available':`${reference.city} reference · no GPS fix`}</span><button onClick={()=>go('Vehicle details')}>Vehicle details<ArrowUpRight size={16} aria-hidden="true"/></button></div>
 </section>;
}
