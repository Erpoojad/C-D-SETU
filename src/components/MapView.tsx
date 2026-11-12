import { useEffect, useRef } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

export interface MapMarker {
  id: string;
  lat: number;
  lng: number;
  label: string;
  /** Tailwind-ish hex colour for the dot */
  color?: string;
}

interface Props {
  markers?: MapMarker[];
  /** When set, clicking the map moves a draggable pin and reports its position. */
  pick?: { lat: number | null; lng: number | null; onPick: (lat: number, lng: number) => void };
  height?: number;
  onMarkerClick?: (id: string) => void;
}

// Centre of India, used only when there is nothing to show yet.
const INDIA: L.LatLngTuple = [21.0, 78.5];

const dot = (color: string) =>
  L.divIcon({
    className: '',
    html: `<span style="display:block;width:16px;height:16px;border-radius:9999px;background:${color};border:3px solid white;box-shadow:0 1px 4px rgba(0,0,0,.4)"></span>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8],
  });

const pinIcon = L.divIcon({
  className: '',
  html: `<svg width="28" height="40" viewBox="0 0 28 40"><path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 26 14 26s14-15.5 14-26C28 6.3 21.7 0 14 0z" fill="#059669"/><circle cx="14" cy="14" r="5.5" fill="white"/></svg>`,
  iconSize: [28, 40],
  iconAnchor: [14, 40],
});

export function MapView({ markers = [], pick, height = 320, onMarkerClick }: Props) {
  const el = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layer = useRef<L.LayerGroup | null>(null);
  const pin = useRef<L.Marker | null>(null);
  const onPick = useRef(pick?.onPick);
  onPick.current = pick?.onPick;

  useEffect(() => {
    if (!el.current || map.current) return;
    const m = L.map(el.current, { scrollWheelZoom: false }).setView(INDIA, 5);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(m);
    layer.current = L.layerGroup().addTo(m);
    if (pick) {
      m.on('click', (e: L.LeafletMouseEvent) => onPick.current?.(round(e.latlng.lat), round(e.latlng.lng)));
    }
    map.current = m;
    return () => {
      m.remove();
      map.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // markers
  useEffect(() => {
    const m = map.current;
    if (!m || !layer.current) return;
    layer.current.clearLayers();
    for (const mk of markers) {
      const marker = L.marker([mk.lat, mk.lng], { icon: dot(mk.color ?? '#059669'), title: mk.label }).bindTooltip(mk.label);
      if (onMarkerClick) marker.on('click', () => onMarkerClick(mk.id));
      marker.addTo(layer.current);
    }
    if (!pick && markers.length) {
      const b = L.latLngBounds(markers.map((x) => [x.lat, x.lng] as L.LatLngTuple));
      m.fitBounds(b.pad(0.3), { maxZoom: 14 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [JSON.stringify(markers)]);

  // pick pin
  useEffect(() => {
    const m = map.current;
    if (!m || !pick) return;
    if (pick.lat == null || pick.lng == null) {
      pin.current?.remove();
      pin.current = null;
      return;
    }
    const ll: L.LatLngTuple = [pick.lat, pick.lng];
    if (!pin.current) {
      pin.current = L.marker(ll, { icon: pinIcon, draggable: true }).addTo(m);
      pin.current.on('dragend', () => {
        const p = pin.current!.getLatLng();
        onPick.current?.(round(p.lat), round(p.lng));
      });
      m.setView(ll, Math.max(m.getZoom(), 15));
    } else {
      pin.current.setLatLng(ll);
    }
  }, [pick?.lat, pick?.lng]);

  return <div ref={el} style={{ height }} className="w-full rounded-xl border border-slate-200 overflow-hidden z-0 relative" />;
}

const round = (n: number) => Math.round(n * 1e5) / 1e5;
