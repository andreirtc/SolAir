import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Vehicle } from "./types";
import { stamp } from "./api";
import {vehicleMapReference,hasMapPosition} from './map-reference';
import {formatDistance,locationTime,type GPSPoint,type RecordedStay,type LocationLeg} from './location-history';
const DEFAULT_REFERENCE=vehicleMapReference();
export default function FleetMap({
  vehicles,
  select,
  mode,
  selectedId,
  focus,
  recordedRoute,
}: {
  vehicles: Vehicle[];
  select: (id: string) => void;
  mode: string;
  selectedId?:string;
  focus?:{latitude:number;longitude:number;label:string};
  recordedRoute?:{segments:GPSPoint[][];stops:RecordedStay[];legs:LocationLeg[]};
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);
  const [showTrack,setShowTrack]=useState(true);
  const viewRef=useRef<{key:string;hasFix:boolean}|null>(null);
  const focusedRef=useRef(false);
  const activeVehicle=vehicles.find(v=>v.id===selectedId)||vehicles[0];
  const reference=vehicleMapReference(activeVehicle);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView(DEFAULT_REFERENCE.center,DEFAULT_REFERENCE.zoom);
    mapRef.current = map;
    markerLayer.current = L.layerGroup().addTo(map);
    setTileError(false);
    L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      // OSM requires a real browser Referer; send the origin without private paths.
      referrerPolicy: "strict-origin-when-cross-origin",
      maxZoom: 19,
    }).on("tileerror", () => setTileError(true)).addTo(map);
    const timer = setTimeout(() => map.invalidateSize(), 100);
    const resizeObserver=typeof ResizeObserver==='undefined'?null:new ResizeObserver(()=>map.invalidateSize({animate:false}));
    resizeObserver?.observe(el.current);
    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
      map.remove();
      mapRef.current = null;
      markerLayer.current = null;
      viewRef.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current, layer = markerLayer.current;
    if (!map || !layer) return;
    layer.clearLayers();
    for (const v of vehicles) {
      if (!hasMapPosition(v)) continue;
      const p: L.LatLngExpression = [v.gps.latitude, v.gps.longitude];
      const freshFix=Boolean(v.telemetry?.gps_fix&&v.telemetry.gps_fix_age_ms!==null&&v.telemetry.gps_fix_age_ms+Math.max(0,Date.now()-Date.parse(v.telemetry.received_at))<=30000);
      const label = document.createElement("div");
      label.textContent = `${v.id} · ${v.driver_display_name||v.driver_name||v.name} · ${v.status} · ${mode === "demo" ? "SIMULATED · " : ""}${stamp(v.gps.measured_at)} · Last known`;
      const marker = L.marker(p, {
        icon: L.divIcon({
          className: "map-vehicle",
          html: `<span class="${freshFix ? 'online' : 'offline'}">${v.id}</span>`,
          iconSize: [66, 30],
          iconAnchor: [33, 15],
        }),
      })
        .addTo(layer)
        .bindPopup(label);
      marker.on("click", () => select(v.id));
    }
    const key=`${mode}:${activeVehicle?.id||'unassigned'}:${reference.city}`;
    const hasFix=!!activeVehicle&&hasMapPosition(activeVehicle);
    if(viewRef.current?.key!==key||viewRef.current.hasFix!==hasFix){
      if(activeVehicle&&hasMapPosition(activeVehicle))map.setView([activeVehicle.gps.latitude,activeVehicle.gps.longitude],14,{animate:false});
      else map.setView(reference.center,reference.zoom,{animate:false});
    }
    viewRef.current={key,hasFix};
  }, [vehicles, mode, select, activeVehicle, reference]);
  useEffect(()=>{
    const map=mapRef.current;if(!map)return;
    if(focus){
      focusedRef.current=true;
      const label=document.createElement('div');label.textContent=focus.label;
      const marker=L.circleMarker([focus.latitude,focus.longitude],{radius:12,color:'#1959B5',weight:3,fillColor:'#EFB142',fillOpacity:.75}).addTo(map).bindPopup(label);
      map.setView([focus.latitude,focus.longitude],16,{animate:false});marker.openPopup();
      return()=>{marker.remove();};
    }
    if(focusedRef.current){focusedRef.current=false;if(activeVehicle&&hasMapPosition(activeVehicle))map.setView([activeVehicle.gps.latitude,activeVehicle.gps.longitude],14,{animate:false});else map.setView(reference.center,reference.zoom,{animate:false});}
  },[focus,activeVehicle,reference]);
  useEffect(()=>{
    const map=mapRef.current;if(!map||!recordedRoute||!showTrack)return;
    const layer=L.layerGroup().addTo(map);
    for(const segment of recordedRoute.segments){
      if(segment.length<2)continue;
      const points=segment.map(point=>[point.latitude,point.longitude] as L.LatLngTuple);
      L.polyline(points,{color:'#FFFDF8',weight:9,opacity:.9,lineCap:'round',lineJoin:'round',smoothFactor:0,interactive:false,className:'location-track-casing'}).addTo(layer);
      L.polyline(points,{color:'#1959B5',weight:5,opacity:1,lineCap:'round',lineJoin:'round',smoothFactor:0,className:'location-track-line'}).addTo(layer);
    }
    recordedRoute.stops.forEach((stop,index)=>{
      const content=document.createElement('div');content.textContent=`${mode==='demo'?'SIMULATED · ':''}Stop ${index+1} · ${Math.floor((stop.end-stop.start)/60000)} min observed · ${locationTime(stop.start)} to ${locationTime(stop.end)}`;
      const tooltip=document.createElement('span');tooltip.textContent=`${index+1} · ${Math.floor((stop.end-stop.start)/60000)} min`;
      L.circleMarker([stop.latitude,stop.longitude],{radius:8,color:'#12458F',weight:3,fillColor:'#EFB142',fillOpacity:1,className:'location-stop-marker'}).addTo(layer).bindPopup(content).bindTooltip(tooltip,{permanent:true,direction:'auto',offset:[0,0],className:'location-stop-tooltip'});
    });
    recordedRoute.legs.forEach(leg=>{
      if(leg.distanceMeters===null||!leg.points.length)return;
      const point=leg.points[Math.floor(leg.points.length/2)],label=document.createElement('span'),seconds=Math.round((leg.to.start-leg.from.end)/1000);
      label.textContent=`${seconds>=60?`${Math.floor(seconds/60)} min`:`${seconds} sec`} · ≈ ${formatDistance(leg.distanceMeters)}`;
      label.title='Recorded interval between stops · estimated GPS distance';
      L.tooltip({permanent:true,direction:'right',className:'location-distance-tooltip'}).setLatLng([point.latitude,point.longitude]).setContent(label).addTo(layer);
    });
    const points=recordedRoute.segments.flat(),first=points[0],last=points.at(-1);
    if(first&&last&&first.at!==last.at){
      const samePlace=first.latitude===last.latitude&&first.longitude===last.longitude;
      const endpoints=samePlace?[{point:last,end:true,label:'Track start / latest recorded point'}]:[{point:first,end:false,label:'Track start'},{point:last,end:true,label:'Latest recorded point'}];
      for(const endpoint of endpoints){
        const content=document.createElement('div');content.textContent=`${mode==='demo'?'SIMULATED · ':''}${endpoint.label} · ${locationTime(endpoint.point.at)}`;
        L.marker([endpoint.point.latitude,endpoint.point.longitude],{icon:L.divIcon({className:`location-track-endpoint ${endpoint.end?'track-end':'track-start'}`,html:'<span aria-hidden="true"></span>',iconSize:[36,44],iconAnchor:endpoint.end?[18,42]:[18,22],popupAnchor:[0,-24]}),title:endpoint.label,alt:endpoint.label,zIndexOffset:200}).addTo(layer).bindPopup(content);
      }
    }
    return()=>{layer.remove();};
  },[recordedRoute,showTrack,mode]);
  const hasTrack=!!recordedRoute?.segments.some(segment=>segment.length>0);
  function fitTrack(){
    const points=recordedRoute?.segments.flatMap(segment=>segment.map(point=>[point.latitude,point.longitude] as L.LatLngTuple))||[];
    if(points.length){setShowTrack(true);mapRef.current?.fitBounds(L.latLngBounds(points),{paddingTopLeft:[40,310],paddingBottomRight:[40,130],maxZoom:16,animate:false});}
  }
  function showVehicles() {
    const points = vehicles.flatMap((v): L.LatLngTuple[] =>
      hasMapPosition(v) ? [[v.gps.latitude, v.gps.longitude]] : [],
    );
    if (points.length) {
      mapRef.current?.fitBounds(L.latLngBounds(points), {
        padding: [60, 60], maxZoom: 14, animate:false,
      });
    }
  }
  return (
    <div className={`map-wrap${hasTrack&&showTrack?' recorded-track-visible':''}`}>
      <div ref={el} className="fleet-map" />
      <div className="map-location-controls">
        <strong>{focus?'Recorded stop · GPS history':hasTrack&&showTrack?'Recorded GPS track':activeVehicle&&hasMapPosition(activeVehicle)?`${activeVehicle.id} · GPS location`:`${reference.city}, Philippines`}</strong>
        <div>
          <button type="button" onClick={() => mapRef.current?.setView(reference.center, reference.zoom,{animate:false})}>{reference.city} reference</button>
          <button type="button" onClick={showVehicles} disabled={!vehicles.some(hasMapPosition)}>Show vehicles</button>
          {hasTrack&&<button type="button" onClick={fitTrack}>Fit track</button>}
        </div>
        {hasTrack&&<label className="map-track-toggle"><input type="checkbox" checked={showTrack} onChange={event=>setShowTrack(event.target.checked)}/>Show recorded track</label>}
      </div>
      {!focus&&!(hasTrack&&showTrack)&&!vehicles.some(hasMapPosition) && (
        <div className="map-empty">
          <strong>No valid GPS positions</strong>
          <span>
            Waiting for a device fix. Showing {reference.city} as a reference, not a vehicle position.
          </span>
        </div>
      )}
      <div className="map-note">
        {tileError && "Basemap unavailable · recorded GPS markers remain. "}
        {focus?`${mode==='demo'?'SIMULATED · ':''}RECORDED STOP · not live`:hasTrack&&showTrack?`${mode==='demo'?'SIMULATED · ':''}RECORDED GPS TRACK · gaps omitted`:<>{mode === "demo" ? "SIMULATED LOCATIONS" : "LAST KNOWN GPS"} · Select a vehicle marker</>}
      </div>
    </div>
  );
}
