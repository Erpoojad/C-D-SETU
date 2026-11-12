import React, { useState } from 'react';
import { Camera, MapPin, MapPinned, Plus } from 'lucide-react';
import { api, photoUrl } from '../api';
import { useSession } from '../lib/session';
import { REPORT_STATUS_LABELS, dateTime, timeAgo } from '../lib/format';
import { compressImage } from '../lib/image';
import type { DumpingReport, ReportStatus } from '../types';
import { LocationPicker } from '../components/LocationPicker';
import { MapView } from '../components/MapView';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, PageHeader, Select, Textarea, useLoad, useToast } from '../components/ui';

const STATUSES: ReportStatus[] = ['reported', 'inspected', 'dispatched', 'cleared'];
const TONE: Record<ReportStatus, 'red' | 'amber' | 'blue' | 'green'> = {
  reported: 'red',
  inspected: 'amber',
  dispatched: 'blue',
  cleared: 'green',
};
const COLOR: Record<ReportStatus, string> = { reported: '#dc2626', inspected: '#d97706', dispatched: '#0284c7', cleared: '#059669' };

export function ReportsView() {
  const { user } = useSession();
  const u = user!;
  const [city, setCity] = useState(u.city);
  const [query, setQuery] = useState(u.city);
  const list = useLoad(() => api.get<DumpingReport[]>(`/reports?city=${encodeURIComponent(query)}`), [query]);
  const [adding, setAdding] = useState(false);
  const [editing, setEditing] = useState<DumpingReport | null>(null);
  const toast = useToast();

  const reports = list.data ?? [];
  const open = reports.filter((r) => r.status !== 'cleared').length;
  const markers = reports
    .filter((r) => r.lat != null && r.lng != null)
    .map((r) => ({ id: r.id, lat: r.lat!, lng: r.lng!, label: `${REPORT_STATUS_LABELS[r.status]}: ${r.location}`, color: COLOR[r.status] }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Illegal dumping reports"
        subtitle={
          u.role === 'authority'
            ? 'Hotspots reported by citizens in your city. Update each one as your team inspects and clears it; the reporter is notified through their points log.'
            : 'Seen debris dumped on a roadside, drain or open plot? Report it to the municipal authority. You earn 25 points when it is cleared.'
        }
        action={<Button onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Report dumping</Button>}
      />
      <form
        className="flex flex-wrap items-center gap-2 mb-5"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(city.trim() || u.city);
        }}
      >
        <Input className="max-w-xs" value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
        <Button type="submit" variant="secondary">Show</Button>
        {!list.loading && <span className="text-sm text-slate-500">{open} open of {reports.length} in {query}</span>}
      </form>

      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox message={list.error} onRetry={list.reload} />
      ) : !reports.length ? (
        <Empty icon={<MapPinned className="w-5 h-5" />} title={`No dumping reported in ${query}`}>Reports from citizens will appear here.</Empty>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 grid gap-3 content-start">
            {reports.map((r) => (
              <Card key={r.id} className="p-4 flex gap-4">
                {r.photo_id && (
                  <a href={photoUrl(r.photo_id)} target="_blank" rel="noreferrer" className="shrink-0">
                    <img src={photoUrl(r.photo_id)} alt="" className="w-24 h-24 object-cover rounded-lg" loading="lazy" />
                  </a>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-slate-900">{r.location}</span>
                    <Badge tone={TONE[r.status]}>{REPORT_STATUS_LABELS[r.status]}</Badge>
                  </div>
                  <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[r.landmark, r.ward && `Ward ${r.ward}`, r.city].filter(Boolean).join(' · ')}
                  </div>
                  {r.est_tonnage && <div className="text-sm text-slate-700 mt-1">Approx. {r.est_tonnage}</div>}
                  {r.remarks && <p className="text-sm text-slate-600 mt-1">{r.remarks}</p>}
                  {r.authority_note && <p className="text-sm text-sky-800 bg-sky-50 rounded-lg px-2 py-1 mt-2">ULB: {r.authority_note}</p>}
                  <div className="flex flex-wrap items-center justify-between gap-2 mt-2">
                    <span className="text-xs text-slate-500">by {r.reporter_name} · {timeAgo(r.created_at)}</span>
                    {u.role === 'authority' && (
                      <Button size="sm" variant="secondary" onClick={() => setEditing(r)}>Update status</Button>
                    )}
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              {markers.length ? <MapView markers={markers} height={420} /> : <div className="text-sm text-slate-500 p-4 bg-white border border-slate-200 rounded-xl">No report has a map pin.</div>}
            </div>
          </div>
        </div>
      )}

      {adding && (
        <NewReport
          defaultCity={u.city}
          onClose={() => setAdding(false)}
          onDone={(r) => {
            setAdding(false);
            setCity(r.city);
            setQuery(r.city);
            list.reload();
            toast('Report sent to the municipal authority.');
          }}
        />
      )}
      {editing && (
        <UpdateReport
          r={editing}
          onClose={() => setEditing(null)}
          onDone={() => {
            setEditing(null);
            list.reload();
            toast('Report updated.');
          }}
        />
      )}
    </div>
  );
}

function NewReport({ defaultCity, onClose, onDone }: { defaultCity: string; onClose: () => void; onDone: (r: DumpingReport) => void }) {
  const [f, setF] = useState({ location: '', landmark: '', ward: '', city: defaultCity, est_tonnage: '', remarks: '' });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [photo, setPhoto] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF({ ...f, [k]: e.target.value });

  const pickPhoto = async (file?: File) => {
    if (!file) return;
    try {
      const c = await compressImage(file);
      setPhoto({ ...c, preview: `data:${c.mime};base64,${c.data}` });
    } catch (e: any) {
      setError(e.message);
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      let photo_id: string | null = null;
      if (photo) photo_id = (await api.post<{ id: string }>('/photos', { data: photo.data, mime: photo.mime })).id;
      onDone(await api.post<DumpingReport>('/reports', { ...f, lat, lng, photo_id }));
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Report illegal dumping" onClose={onClose} wide>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Where is it?" className="sm:col-span-2">
          <Input required value={f.location} onChange={set('location')} placeholder="e.g. Service road behind Dwarka circle" />
        </Field>
        <Field label="Nearby landmark"><Input value={f.landmark} onChange={set('landmark')} /></Field>
        <Field label="Ward number (if known)"><Input value={f.ward} onChange={set('ward')} /></Field>
        <Field label="City"><Input required value={f.city} onChange={set('city')} /></Field>
        <Field label="Rough size" hint="e.g. 2 tractor loads, ~5 tonnes"><Input value={f.est_tonnage} onChange={set('est_tonnage')} /></Field>
        <Field label="Details" className="sm:col-span-2">
          <Textarea value={f.remarks} onChange={set('remarks')} placeholder="What is dumped, is it blocking a drain or road, any vehicle seen…" />
        </Field>
        <div className="sm:col-span-2">
          <span className="block text-xs font-bold text-slate-700 mb-1">Photo (recommended)</span>
          <div className="flex items-center gap-3">
            {photo && <img src={photo.preview} alt="" className="w-20 h-20 object-cover rounded-lg" />}
            <label className="inline-flex items-center gap-2 px-3 py-2 text-sm font-semibold border border-slate-300 rounded-lg cursor-pointer hover:bg-slate-50">
              <Camera className="w-4 h-4" /> {photo ? 'Change photo' : 'Add photo'}
              <input type="file" accept="image/*" capture="environment" className="sr-only" onChange={(e) => pickPhoto(e.target.files?.[0])} />
            </label>
          </div>
        </div>
        <div className="sm:col-span-2">
          <LocationPicker lat={lat} lng={lng} onChange={(a, b) => (setLat(a), setLng(b))} />
        </div>
        {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Send report</Button>
        </div>
      </form>
    </Modal>
  );
}

function UpdateReport({ r, onClose, onDone }: { r: DumpingReport; onClose: () => void; onDone: () => void }) {
  const [status, setStatus] = useState<ReportStatus>(r.status);
  const [note, setNote] = useState(r.authority_note);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const save = async () => {
    setBusy(true);
    setError(null);
    try {
      await api.patch(`/reports/${r.id}`, { status, authority_note: note });
      onDone();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setBusy(false);
    }
  };
  return (
    <Modal title={r.location} onClose={onClose}>
      <div className="space-y-4">
        <div className="text-xs text-slate-500">Reported {dateTime(r.created_at)} by {r.reporter_name}</div>
        <Field label="Status">
          <Select value={status} onChange={(e) => setStatus(e.target.value as ReportStatus)}>
            {STATUSES.map((s) => <option key={s} value={s}>{REPORT_STATUS_LABELS[s]}</option>)}
          </Select>
        </Field>
        <Field label="Note to the reporter" hint="e.g. inspection date, penalty issued, clean-up vehicle number">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} />
        </Field>
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Cancel</Button>
          <Button busy={busy} onClick={save}>Save</Button>
        </div>
      </div>
    </Modal>
  );
}
