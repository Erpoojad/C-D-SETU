import { Crosshair, X } from 'lucide-react';
import { MapView } from './MapView';
import { Button, CoordsBadge, useMyLocation } from './ui';

export function LocationPicker({
  lat,
  lng,
  onChange,
}: {
  lat: number | null;
  lng: number | null;
  onChange: (lat: number | null, lng: number | null) => void;
}) {
  const { busy, locate } = useMyLocation();
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-bold text-slate-700">Map pin (optional, enables distance matching)</span>
        <div className="flex items-center gap-2">
          <CoordsBadge lat={lat} lng={lng} />
          {lat != null && (
            <button type="button" className="text-slate-400 hover:text-slate-700" onClick={() => onChange(null, null)} aria-label="Clear pin">
              <X className="w-4 h-4" />
            </button>
          )}
          <Button type="button" size="sm" variant="secondary" busy={busy} onClick={() => locate((a, b) => onChange(a, b))}>
            <Crosshair className="w-3.5 h-3.5" /> Use my location
          </Button>
        </div>
      </div>
      <MapView height={220} pick={{ lat, lng, onPick: (a, b) => onChange(a, b) }} />
      <p className="text-xs text-slate-500">Tap the map to drop the pin, or drag it to adjust.</p>
    </div>
  );
}
