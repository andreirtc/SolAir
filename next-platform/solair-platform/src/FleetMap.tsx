import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Vehicle } from "./types";
import { stamp } from "./api";
export default function FleetMap({
  vehicles,
  select,
  mode,
}: {
  vehicles: Vehicle[];
  select: (id: string) => void;
  mode: string;
}) {
  const el = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markerLayer = useRef<L.LayerGroup | null>(null);
  const fitted = useRef(false);
  const lastMode = useRef(mode);
  const [tileError, setTileError] = useState(false);
  useEffect(() => {
    if (!el.current) return;
    const map = L.map(el.current, {
      scrollWheelZoom: false,
      zoomAnimation: false,
      fadeAnimation: false,
      markerZoomAnimation: false,
    }).setView([14.61, 121.0], 12);
    mapRef.current = map;
    markerLayer.current = L.layerGroup().addTo(map);
    setTileError(false);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).on("tileerror", () => setTileError(true)).addTo(map);
    const timer = setTimeout(() => map.invalidateSize(), 100);
    return () => {
      clearTimeout(timer);
      map.remove();
      mapRef.current = null;
      markerLayer.current = null;
    };
  }, []);
  useEffect(() => {
    const map = mapRef.current, layer = markerLayer.current;
    if (!map || !layer) return;
    if (lastMode.current !== mode) { fitted.current = false; lastMode.current = mode; }
    layer.clearLayers();
    const pts: L.LatLngExpression[] = [];
    for (const v of vehicles) {
      if (!v.gps) continue;
      const p: L.LatLngExpression = [v.gps.latitude, v.gps.longitude];
      const freshFix=Boolean(v.telemetry?.gps_fix&&v.telemetry.gps_fix_age_ms!==null&&v.telemetry.gps_fix_age_ms+Math.max(0,Date.now()-Date.parse(v.telemetry.received_at))<=30000);
      pts.push(p);
      const label = document.createElement("div");
      label.textContent = `${v.id} · ${v.status} · ${mode === "demo" ? "SIMULATED · " : ""}${stamp(v.gps.measured_at)} · Last known`;
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
    if (pts.length && !fitted.current) {
      map.fitBounds(L.latLngBounds(pts), { padding: [40, 40], maxZoom: 14 });
      fitted.current = true;
    }
  }, [vehicles, mode, select]);
  return (
    <div className="map-wrap">
      <div ref={el} className="fleet-map" />
      {!vehicles.some((v) => v.gps) && (
        <div className="map-empty">
          <strong>No valid GPS positions</strong>
          <span>
            Waiting for a genuine device fix. Map is a regional reference only.
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
