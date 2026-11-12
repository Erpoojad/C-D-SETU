import { useState } from 'react';
import { AlertTriangle, Camera, Truck } from 'lucide-react';
import { api } from '../api';
import { navigate } from '../lib/session';
import { MATERIALS, inr, materialLabel, num } from '../lib/format';
import { compressImage } from '../lib/image';
import type { ScanResult } from '../types';
import { Badge, Button, Card, ErrorBox, Field, Loading, NumberInput, PageHeader, useLoad } from '../components/ui';

export function ScannerView() {
  const health = useLoad(() => api.get<{ ok: boolean; scanner: boolean }>('/health'));
  const [photo, setPhoto] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [volume, setVolume] = useState<number | ''>('');
  const [result, setResult] = useState<ScanResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pick = async (file?: File) => {
    if (!file) return;
    setError(null);
    setResult(null);
    try {
      const c = await compressImage(file);
      setPhoto({ ...c, preview: `data:${c.mime};base64,${c.data}` });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const scan = async () => {
    if (!photo) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await api.post<ScanResult>('/scan', { data: photo.data, mime: photo.mime, volumeM3: volume === '' ? undefined : Number(volume) }));
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };

  if (health.loading) return <Loading />;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Scan a debris heap"
        subtitle="Take a photo of the heap. The scanner estimates what it is made of and, if something in the frame shows scale, how much there is. Treat the result as a first estimate, not a weighbridge reading."
      />
      {!health.data?.scanner ? (
        <Card className="p-6">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-sm text-slate-700">
              <p className="font-semibold">The photo scanner is not switched on for this site yet.</p>
              <p className="mt-1">The administrator needs to add a Gemini API key on the server. Until then, estimate your load with the calculator from your plan area.</p>
              <Button className="mt-4" variant="secondary" onClick={() => navigate('/calculator')}>Open the calculator</Button>
            </div>
          </div>
        </Card>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="p-5 space-y-4">
            <div className="aspect-[4/3] rounded-xl bg-slate-100 overflow-hidden flex items-center justify-center">
              {photo ? <img src={photo.preview} alt="Selected heap" className="w-full h-full object-cover" /> : <Camera className="w-10 h-10 text-slate-400" />}
            </div>
            <label className="flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
              <Camera className="w-4 h-4" /> {photo ? 'Choose another photo' : 'Take or choose a photo'}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
            </label>
            <Field label="Measured heap volume, m³ (optional)" hint="If you measured length × width × average height, enter it here. It is far more accurate than estimating from a photo.">
              <NumberInput min={0} step={0.5} value={volume} onChange={setVolume} />
            </Field>
            <Button className="w-full" disabled={!photo} busy={busy} onClick={scan}>Analyse photo</Button>
            {error && <ErrorBox message={error} />}
          </Card>

          <div>
            {busy && <Loading />}
            {result && !busy && <Result r={result} />}
            {!result && !busy && (
              <div className="text-sm text-slate-500 p-6 border-2 border-dashed border-slate-200 rounded-2xl">
                For a useful estimate, photograph the whole heap in daylight with a person, door or vehicle beside it for scale.
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function Result({ r }: { r: ScanResult }) {
  if (!r.isConstructionWaste) {
    return (
      <Card className="p-5 text-sm text-slate-700">
        <p className="font-semibold">This does not look like construction or demolition debris.</p>
        <p className="mt-1">Try a clearer photo of the heap itself.</p>
      </Card>
    );
  }
  const rows = MATERIALS.filter((m) => r.composition[m] > 0).sort((a, b) => r.composition[b] - r.composition[a]);
  return (
    <Card className="p-5 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <Badge tone={r.confidence === 'high' ? 'green' : r.confidence === 'medium' ? 'amber' : 'red'}>{r.confidence} confidence</Badge>
        <Badge tone={r.segregated ? 'green' : 'amber'}>{r.segregated ? 'Mostly one material' : 'Mixed load'}</Badge>
      </div>
      <div>
        <div className="text-xs font-bold uppercase text-slate-500 mb-2">Estimated composition (by mass)</div>
        <div className="space-y-1.5">
          {rows.map((m) => (
            <div key={m}>
              <div className="flex justify-between text-xs text-slate-700"><span>{materialLabel(m)}</span><span className="font-semibold tabular-nums">{r.composition[m]}%</span></div>
              <div className="h-2 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-emerald-600" style={{ width: `${r.composition[m]}%` }} /></div>
            </div>
          ))}
        </div>
      </div>
      {r.estimatedTonnes ? (
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div><div className="text-xs text-slate-500">Volume</div><div className="font-bold">{num(r.estimatedVolumeM3)} m³</div></div>
          <div><div className="text-xs text-slate-500">Weight (loose)</div><div className="font-bold">≈ {num(r.estimatedTonnes)} t</div></div>
          <div><div className="text-xs text-slate-500">Salvage if segregated</div><div className="font-bold text-emerald-700">{inr(r.salvageInrIfSegregated)}</div></div>
          <div><div className="text-xs text-slate-500">Cost to dump mixed</div><div className="font-bold text-red-700">{inr(r.mixedDisposalInr)}</div></div>
        </div>
      ) : (
        <p className="text-sm text-amber-800 bg-amber-50 rounded-lg p-3">Nothing in the photo shows scale, so the weight was not estimated. Enter a measured volume and analyse again.</p>
      )}
      {r.contaminants.length > 0 && <p className="text-sm text-slate-700"><b>Contaminants:</b> {r.contaminants.join(', ')}</p>}
      {r.advice && <p className="text-sm text-slate-700"><b>Advice:</b> {r.advice}</p>}
      <Button
        className="w-full"
        onClick={() =>
          navigate('/pickups', { new: 1, tons: r.estimatedTonnes ?? undefined, material: r.dominantMaterial, segregated: r.segregated ? 1 : undefined })
        }
      >
        <Truck className="w-4 h-4" /> Request a pickup for this load
      </Button>
    </Card>
  );
}
