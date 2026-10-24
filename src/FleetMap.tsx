import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Vehicle } from "./types";
import { stamp } from "./api";
import {vehicleMapReference,hasMapPosition} from './map-reference';
const DEFAULT_REFERENCE=vehicleMapReference();
export default function FleetMap({
  vehicles,
  select,
  mode,
  selectedId,
}: {
  vehicles: Vehicle[];
  select: (id: string) => void;
  mode: string;
  selectedId?:string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const [tileError, setTileError] = useState(false);
  const viewRef=useRef<{key:string;hasFix:boolean}|null>(null);
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
    return () => {
      clearTimeout(timer);
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
    <div className="map-wrap">
      <div ref={el} className="fleet-map" />
      <div className="map-location-controls">
        <strong>{activeVehicle&&hasMapPosition(activeVehicle)?`${activeVehicle.id} · GPS location`:`${reference.city}, Philippines`}</strong>
        <div>
          <button type="button" onClick={() => mapRef.current?.setView(reference.center, reference.zoom,{animate:false})}>{reference.city} reference</button>
          <button type="button" onClick={showVehicles} disabled={!vehicles.some(hasMapPosition)}>Show vehicles</button>
        </div>
      </div>
      {!vehicles.some(hasMapPosition) && (
        <div className="map-empty">
          <strong>No valid GPS positions</strong>
          <span>
            Waiting for a device fix. Showing {reference.city} as a reference, not a vehicle position.
          </span>
        </div>
      )}
      <div className="map-note">
        {tileError && "Basemap unavailable · recorded GPS markers remain. "}
        {mode === "demo" ? "SIMULATED LOCATIONS" : "LAST KNOWN GPS"} · Select a
        vehicle marker
      </div>
    </div>
  );
}
