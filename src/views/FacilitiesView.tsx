import React, { useState } from 'react';
import { Factory, MapPin, Phone, Plus, ShieldCheck, Trash2 } from 'lucide-react';
import { api } from '../api';
import { useSession } from '../lib/session';
import { MATERIALS, inr, materialLabel, num } from '../lib/format';
import type { Facility, FacilityType, MaterialCategory } from '../types';
import { LocationPicker } from '../components/LocationPicker';
import { MapView } from '../components/MapView';
import { Badge, Button, Card, Checkbox, Empty, ErrorBox, Field, Input, Loading, Modal, NumberInput, PageHeader, Select, useLoad, useToast } from '../components/ui';

const TYPES: FacilityType[] = ['Centralized Plant', 'Decentralized Micro-Crusher', 'Direct Reuse Site', 'Ward Collection Point'];

export function FacilitiesView() {
  const { user } = useSession();
  const [city, setCity] = useState(user?.city ?? '');
  const [query, setQuery] = useState(user?.city ?? '');
  const list = useLoad(() => api.get<Facility[]>(`/facilities${query ? `?city=${encodeURIComponent(query)}` : ''}`), [query]);
  const [adding, setAdding] = useState(false);
  const toast = useToast();
  const canAdd = user && (user.role === 'recycler' || user.role === 'authority');

  const remove = async (f: Facility) => {
    if (!window.confirm(`Remove ${f.name}? Pickups already delivered there keep their manifests.`)) return;
    try {
      await api.del(`/facilities/${f.id}`);
      list.reload();
      toast('Facility removed.');
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const facilities = list.data ?? [];
  const markers = facilities
    .filter((f) => f.lat != null && f.lng != null)
    .map((f) => ({ id: f.id, lat: f.lat!, lng: f.lng!, label: `${f.name} (${f.type})` }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Processing facilities"
        subtitle="Plants, micro-crushers, reuse sites and ward collection points that accept C&D waste. Transporters pick a destination from this list."
        action={canAdd ? <Button onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Register facility</Button> : undefined}
      />
      <form
        className="flex gap-2 mb-5 max-w-md"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(city.trim());
        }}
      >
        <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City (leave blank for all)" />
        <Button type="submit" variant="secondary">Search</Button>
      </form>

      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox message={list.error} onRetry={list.reload} />
      ) : !facilities.length ? (
        <Empty icon={<Factory className="w-5 h-5" />} title={query ? `No facilities registered in ${query} yet` : 'No facilities registered yet'}>
          {canAdd ? 'Register your plant so transporters can deliver loads to it.' : 'Recyclers and municipal officers can register facilities here.'}
        </Empty>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          <div className="lg:col-span-3 grid gap-3 content-start">
            {facilities.map((f) => (
              <Card key={f.id} className="p-4">
                <div className="flex flex-wrap items-start justify-between gap-2">
                  <div>
                    <div className="font-bold text-slate-900">{f.name}</div>
                    <div className="text-xs font-semibold text-emerald-700">{f.type}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {f.ulb_authorization ? (
                      <Badge tone="blue"><ShieldCheck className="w-3 h-3" /> ULB auth. {f.ulb_authorization}</Badge>
                    ) : (
                      <Badge tone="amber">Authorisation not stated</Badge>
                    )}
                    {user?.id === f.owner_id && (
                      <button onClick={() => remove(f)} className="p-1.5 text-slate-400 hover:text-red-600" aria-label={`Remove ${f.name}`}>
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-sm text-slate-600 mt-2 flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {f.address}, {f.city}</div>
                <div className="text-sm text-slate-600 flex items-center gap-1"><Phone className="w-3.5 h-3.5" /> {f.owner_name}{f.owner_phone ? ` · ${f.owner_phone}` : ''}</div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {f.accepted_materials.map((m) => <Badge key={m}>{materialLabel(m)}</Badge>)}
                </div>
                <div className="text-xs text-slate-500 mt-2">
                  Capacity {num(f.capacity_tpd, 0)} t/day · gate fee {f.processing_cost_per_t ? `${inr(f.processing_cost_per_t)}/t` : 'free'}
                </div>
              </Card>
            ))}
          </div>
          <div className="lg:col-span-2">
            <div className="lg:sticky lg:top-20">
              {markers.length ? (
                <MapView markers={markers} height={420} />
              ) : (
                <div className="text-sm text-slate-500 p-4 bg-white border border-slate-200 rounded-xl">None of these facilities has a map pin yet.</div>
              )}
            </div>
          </div>
        </div>
      )}

      {adding && (
        <AddFacility
          defaultCity={user?.city ?? ''}
          onClose={() => setAdding(false)}
          onAdded={(f) => {
            setAdding(false);
            setCity(f.city);
            setQuery(f.city);
            list.reload();
            toast(`${f.name} is now listed.`);
          }}
        />
      )}
    </div>
  );
}

function AddFacility({ defaultCity, onClose, onAdded }: { defaultCity: string; onClose: () => void; onAdded: (f: Facility) => void }) {
  const [f, setF] = useState({
    name: '',
    type: 'Decentralized Micro-Crusher' as FacilityType,
    address: '',
    city: defaultCity,
    ulb_authorization: '',
  });
  const [lat, setLat] = useState<number | null>(null);
  const [lng, setLng] = useState<number | null>(null);
  const [capacity, setCapacity] = useState<number | ''>('');
  const [fee, setFee] = useState<number | ''>('');
  const [materials, setMaterials] = useState<MaterialCategory[]>(['concrete', 'brick_masonry']);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      const created = await api.post<Facility>('/facilities', {
        ...f,
        lat,
        lng,
        capacity_tpd: Number(capacity || 0),
        processing_cost_per_t: Number(fee || 0),
        accepted_materials: materials,
      });
      onAdded(created);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const toggle = (m: MaterialCategory, on: boolean) => setMaterials(on ? [...materials, m] : materials.filter((x) => x !== m));

  return (
    <Modal title="Register facility" onClose={onClose} wide>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Facility name">
          <Input required value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        </Field>
        <Field label="Type">
          <Select value={f.type} onChange={(e) => setF({ ...f, type: e.target.value as FacilityType })}>
            {TYPES.map((t) => <option key={t}>{t}</option>)}
          </Select>
        </Field>
        <Field label="Address">
          <Input required value={f.address} onChange={(e) => setF({ ...f, address: e.target.value })} />
        </Field>
        <Field label="City">
          <Input required value={f.city} onChange={(e) => setF({ ...f, city: e.target.value })} />
        </Field>
        <Field label="Capacity (tonnes per day)">
          <NumberInput required min={0} value={capacity} onChange={setCapacity} />
        </Field>
        <Field label="Gate fee (₹ per tonne)" hint="0 if you accept segregated loads free">
          <NumberInput required min={0} value={fee} onChange={setFee} />
        </Field>
        <Field label="ULB authorisation number" hint="Under Rule 4 of the C&D Waste Management Rules, 2016" className="sm:col-span-2">
          <Input value={f.ulb_authorization} onChange={(e) => setF({ ...f, ulb_authorization: e.target.value })} />
        </Field>
        <fieldset className="sm:col-span-2">
          <legend className="text-xs font-bold text-slate-700 mb-2">Materials accepted</legend>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {MATERIALS.map((m) => (
              <Checkbox key={m} checked={materials.includes(m)} onChange={(v) => toggle(m, v)} label={materialLabel(m)} />
            ))}
          </div>
        </fieldset>
        <div className="sm:col-span-2">
          <LocationPicker lat={lat} lng={lng} onChange={(a, b) => (setLat(a), setLng(b))} />
        </div>
        {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy} disabled={!materials.length}>Register</Button>
        </div>
      </form>
    </Modal>
  );
}
