import React, { useState } from 'react';
import { ImagePlus, MapPin, Package, Plus, Search, ShieldCheck } from 'lucide-react';
import { api, photoUrl } from '../api';
import { navigate, useRoute, useSession } from '../lib/session';
import { MATERIALS, inr, materialLabel, num, timeAgo } from '../lib/format';
import { compressImage } from '../lib/image';
import { freightInr } from '../lib/cdFactors';
import { roadKm } from '../lib/geo';
import type { Listing, MaterialCategory } from '../types';
import {
  Badge, Button, Card, Checkbox, Empty, ErrorBox, Field, Input, Loading, Modal, NumberInput, PageHeader, Select, Textarea, useLoad, useToast,
} from '../components/ui';
import { LocationPicker } from '../components/LocationPicker';

const CONDITIONS = ['Segregated & Graded', 'Clean Demolition', 'Crushed Aggregates', 'Raw Rubble'] as const;

export function MarketplaceView() {
  const { user } = useSession();
  const route = useRoute();
  const [city, setCity] = useState(user?.city ?? '');
  const [category, setCategory] = useState('');
  const [free, setFree] = useState(false);
  const [text, setText] = useState('');
  const [mine, setMine] = useState(false);
  const [ordering, setOrdering] = useState<Listing | null>(null);
  const selling = route.query.get('sell') === '1';

  const qs = new URLSearchParams();
  if (mine) qs.set('mine', '1');
  else {
    if (city) qs.set('city', city);
    if (category) qs.set('category', category);
    if (free) qs.set('free', '1');
    if (text) qs.set('q', text);
  }
  const list = useLoad(() => api.get<Listing[]>(`/listings?${qs}`), [qs.toString()]);
  const canSell = user && user.role !== 'authority';

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="Material exchange"
        subtitle="Buy and sell recycled aggregate, reclaimed bricks, steel and clean fill, or give it away for free to someone nearby."
        action={
          canSell && (
            <Button onClick={() => navigate('/market', { sell: 1 })}>
              <Plus className="w-4 h-4" /> List material
            </Button>
          )
        }
      />

      <Card className="p-4 mb-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
          <Field label="Search">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <Input className="pl-9" value={text} onChange={(e) => setText(e.target.value)} placeholder="20mm aggregate, bricks…" disabled={mine} />
            </div>
          </Field>
          <Field label="City">
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="All cities" disabled={mine} />
          </Field>
          <Field label="Material">
            <Select value={category} onChange={(e) => setCategory(e.target.value)} disabled={mine}>
              <option value="">All materials</option>
              {MATERIALS.map((m) => (
                <option key={m} value={m}>{materialLabel(m)}</option>
              ))}
            </Select>
          </Field>
          <div className="pb-2"><Checkbox checked={free} onChange={setFree} label="Free only" /></div>
          {user && <div className="pb-2"><Checkbox checked={mine} onChange={setMine} label="My listings" /></div>}
        </div>
      </Card>

      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox message={list.error} onRetry={list.reload} />
      ) : list.data!.length === 0 ? (
        <Empty icon={<Package className="w-5 h-5" />} title={mine ? 'You have not listed anything yet' : 'No material listed here yet'}>
          {mine ? 'List reusable material from your site and buyers nearby can order it.' : 'Try another city or material, or be the first to list.'}
        </Empty>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {list.data!.map((l) => (
            <ListingCard key={l.id} l={l} mine={l.seller_id === user?.id} onOrder={() => (user ? setOrdering(l) : navigate('/login'))} onChanged={list.reload} />
          ))}
        </div>
      )}

      {selling && canSell && (
        <SellModal
          onClose={() => navigate('/market')}
          onCreated={() => {
            navigate('/market');
            setMine(true);
            list.reload();
          }}
        />
      )}
      {ordering && <OrderModal l={ordering} onClose={() => setOrdering(null)} />}
    </div>
  );
}

function ListingCard({ l, mine, onOrder, onChanged }: { l: Listing; mine: boolean; onOrder: () => void; onChanged: () => void }) {
  const toast = useToast();
  const setStatus = async (status: string) => {
    try {
      await api.patch(`/listings/${l.id}`, { status });
      toast(status === 'active' ? 'Listing is live again.' : 'Listing withdrawn.');
      onChanged();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };
  return (
    <Card className="overflow-hidden flex flex-col">
      <div className="aspect-[16/9] bg-slate-100 relative">
        {l.photo_id ? (
          <img src={photoUrl(l.photo_id)} alt={l.title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-slate-400"><Package className="w-8 h-8" /></div>
        )}
        <div className="absolute top-2 left-2 flex gap-1">
          {l.price_per_unit === 0 && <Badge tone="green">Free</Badge>}
          {l.is_is383 && <Badge tone="blue"><ShieldCheck className="w-3 h-3" /> IS 383 tested</Badge>}
          {l.status !== 'active' && <Badge tone="slate">{l.status === 'sold_out' ? 'Sold out' : 'Withdrawn'}</Badge>}
        </div>
      </div>
      <div className="p-4 flex-1 flex flex-col">
        <div className="text-xs font-semibold text-emerald-700">{materialLabel(l.category)} · {l.condition}</div>
        <h3 className="font-bold text-slate-900 mt-0.5">{l.title}</h3>
        <div className="text-xs text-slate-500 mt-1 flex items-center gap-1"><MapPin className="w-3 h-3" /> {l.location}, {l.city}</div>
        <div className="text-xs text-slate-500">by {l.seller_company || l.seller_name} · {timeAgo(l.created_at)}</div>
        {l.lab_specs && (
          <div className="grid grid-cols-2 gap-x-3 text-xs text-slate-600 mt-2 p-2 bg-slate-50 rounded-lg">
            {l.lab_specs.aiv && <span>AIV {l.lab_specs.aiv}</span>}
            {l.lab_specs.acv && <span>ACV {l.lab_specs.acv}</span>}
            {l.lab_specs.water_absorption && <span>Water abs. {l.lab_specs.water_absorption}</span>}
            {l.lab_specs.silt && <span>Silt {l.lab_specs.silt}</span>}
          </div>
        )}
        {l.description && <p className="text-sm text-slate-600 mt-2 line-clamp-3">{l.description}</p>}
        <div className="mt-auto pt-4 flex items-end justify-between gap-2">
          <div>
            <div className="text-lg font-extrabold text-slate-900">{l.price_per_unit === 0 ? 'Free' : `${inr(l.price_per_unit)} / ${l.unit}`}</div>
            <div className="text-xs text-slate-500">{num(l.quantity)} {l.unit} available</div>
          </div>
          {mine ? (
            l.status === 'active' ? (
              <Button size="sm" variant="danger" onClick={() => setStatus('withdrawn')}>Withdraw</Button>
            ) : (
              l.quantity > 0 && <Button size="sm" variant="secondary" onClick={() => setStatus('active')}>Relist</Button>
            )
          ) : (
            l.status === 'active' && <Button size="sm" onClick={onOrder}>{l.price_per_unit === 0 ? 'Request' : 'Order'}</Button>
          )}
        </div>
      </div>
    </Card>
  );
}

function SellModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const { user } = useSession();
  const toast = useToast();
  const [f, setF] = useState({
    title: '',
    category: 'concrete' as MaterialCategory,
    grade: '',
    quantity: '' as number | '',
    unit: 'MT',
    price_per_unit: '' as number | '',
    location: '',
    city: user!.city,
    lat: null as number | null,
    lng: null as number | null,
    condition: 'Segregated & Graded',
    is_is383: false,
    aiv: '',
    acv: '',
    water_absorption: '',
    silt: '',
    description: '',
  });
  const [photo, setPhoto] = useState<{ data: string; mime: string; preview: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });

  const pick = async (file?: File) => {
    if (!file) return;
    try {
      const c = await compressImage(file, 1280);
      setPhoto({ ...c, preview: `data:${c.mime};base64,${c.data}` });
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      let photo_id = null;
      if (photo) photo_id = (await api.post<{ id: string }>('/photos', { data: photo.data, mime: photo.mime })).id;
      const hasLab = f.aiv || f.acv || f.water_absorption || f.silt;
      await api.post('/listings', {
        title: f.title, category: f.category, grade: f.grade, quantity: Number(f.quantity), unit: f.unit,
        price_per_unit: Number(f.price_per_unit || 0), location: f.location, city: f.city, lat: f.lat, lng: f.lng,
        condition: f.condition, is_is383: f.is_is383, description: f.description, photo_id,
        lab_specs: hasLab ? { aiv: f.aiv, acv: f.acv, water_absorption: f.water_absorption, silt: f.silt } : null,
      });
      toast('Listed! Buyers can now find it. +20 green points.');
      onCreated();
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="List material" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Title" className="sm:col-span-2">
            <Input required value={f.title} onChange={(e) => set('title', e.target.value)} placeholder="e.g. 20 mm recycled concrete aggregate" />
          </Field>
          <Field label="Material">
            <Select value={f.category} onChange={(e) => set('category', e.target.value as MaterialCategory)}>
              {MATERIALS.map((m) => <option key={m} value={m}>{materialLabel(m)}</option>)}
            </Select>
          </Field>
          <Field label="Condition">
            <Select value={f.condition} onChange={(e) => set('condition', e.target.value)}>
              {CONDITIONS.map((c) => <option key={c}>{c}</option>)}
            </Select>
          </Field>
          <Field label="Grade / size (optional)">
            <Input value={f.grade} onChange={(e) => set('grade', e.target.value)} placeholder="20 mm, Zone II sand, Fe 500 scrap…" />
          </Field>
          <div className="grid grid-cols-2 gap-2">
            <Field label="Quantity"><NumberInput required min={0.01} step={0.01} value={f.quantity} onChange={(v) => set('quantity', v)} /></Field>
            <Field label="Unit">
              <Select value={f.unit} onChange={(e) => set('unit', e.target.value)}>
                <option value="MT">Tonnes (MT)</option><option value="CFT">CFT</option><option value="Nos">Pieces (Nos)</option>
              </Select>
            </Field>
          </div>
          <Field label={`Price per ${f.unit} (₹)`} hint="Enter 0 to give it away free.">
            <NumberInput required min={0} value={f.price_per_unit} onChange={(v) => set('price_per_unit', v)} />
          </Field>
          <Field label="City"><Input required value={f.city} onChange={(e) => set('city', e.target.value)} /></Field>
          <Field label="Pickup location" className="sm:col-span-2">
            <Input required value={f.location} onChange={(e) => set('location', e.target.value)} placeholder="Yard or site address" />
          </Field>
        </div>

        <div className="p-4 rounded-xl bg-slate-50 space-y-3">
          <div className="text-xs font-bold text-slate-700">Lab test results (optional; IS 2386 / IS 383)</div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <Field label="AIV %"><Input value={f.aiv} onChange={(e) => set('aiv', e.target.value)} placeholder="≤ 30" /></Field>
            <Field label="ACV %"><Input value={f.acv} onChange={(e) => set('acv', e.target.value)} placeholder="≤ 30" /></Field>
            <Field label="Water abs. %"><Input value={f.water_absorption} onChange={(e) => set('water_absorption', e.target.value)} /></Field>
            <Field label="Silt %"><Input value={f.silt} onChange={(e) => set('silt', e.target.value)} /></Field>
          </div>
          <Checkbox checked={f.is_is383} onChange={(v) => set('is_is383', v)} label="I have a lab report showing this material meets IS 383:2016" />
        </div>

        <Field label="Description (optional)">
          <Textarea value={f.description} onChange={(e) => set('description', e.target.value)} placeholder="Source structure, suitable uses, loading available…" />
        </Field>

        <div>
          <span className="block text-xs font-bold text-slate-700 mb-1">Photo (optional)</span>
          <label className="flex items-center gap-3 p-3 border border-dashed border-slate-300 rounded-xl cursor-pointer hover:bg-slate-50">
            {photo ? <img src={photo.preview} alt="" className="w-20 h-14 object-cover rounded-lg" /> : <ImagePlus className="w-6 h-6 text-slate-400" />}
            <span className="text-sm text-slate-600">{photo ? 'Change photo' : 'Add a photo of the material'}</span>
            <input type="file" accept="image/*" className="sr-only" onChange={(e) => pick(e.target.files?.[0])} />
          </label>
        </div>

        <LocationPicker lat={f.lat} lng={f.lng} onChange={(lat, lng) => setF({ ...f, lat, lng })} />

        <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Publish listing</Button>
        </div>
      </form>
    </Modal>
  );
}

function OrderModal({ l, onClose }: { l: Listing; onClose: () => void }) {
  const toast = useToast();
  const [qty, setQty] = useState<number | ''>(Math.min(l.quantity, l.unit === 'MT' ? 10 : l.quantity));
  const [site, setSite] = useState('');
  const [km, setKm] = useState<number | ''>('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [here, setHere] = useState<{ lat: number; lng: number } | null>(null);

  const distance = km !== '' ? Number(km) : here && l.lat != null && l.lng != null ? roadKm(here.lat, here.lng, l.lat, l.lng) : 0;
  const material = Number(qty || 0) * l.price_per_unit;
  const freight = l.unit === 'MT' ? freightInr(Number(qty || 0), distance) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      await api.post('/orders', { listing_id: l.id, quantity: Number(qty), delivery_site: site, distance_km: distance, note });
      toast('Order sent. The seller will accept or decline; track it under Orders.');
      onClose();
      navigate('/orders');
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title={`Order: ${l.title}`} onClose={onClose}>
      <form onSubmit={submit} className="space-y-4">
        <Field label={`Quantity (${l.unit})`} hint={`${num(l.quantity)} ${l.unit} available`}>
          <NumberInput required min={0.01} max={l.quantity} step={0.01} value={qty} onChange={setQty} />
        </Field>
        <Field label="Delivery site"><Input required value={site} onChange={(e) => setSite(e.target.value)} /></Field>
        {l.unit === 'MT' && (
          <Field label="Distance to your site (km)" hint={l.lat != null ? 'Leave blank and use your location to estimate it.' : undefined}>
            <div className="flex gap-2">
              <NumberInput min={0} value={km} onChange={setKm} placeholder={distance ? String(distance) : ''} />
              {l.lat != null && (
                <Button type="button" variant="secondary" size="sm" onClick={() => navigator.geolocation?.getCurrentPosition((p) => setHere({ lat: p.coords.latitude, lng: p.coords.longitude }))}>
                  Use my location
                </Button>
              )}
            </div>
          </Field>
        )}
        <Field label="Note to seller (optional)"><Textarea value={note} onChange={(e) => setNote(e.target.value)} /></Field>
        <div className="p-3 bg-slate-50 rounded-xl text-sm space-y-1">
          <div className="flex justify-between"><span>Material</span><span>{inr(material)}</span></div>
          {l.unit === 'MT' && <div className="flex justify-between"><span>Est. freight ({num(distance)} km)</span><span>{inr(freight)}</span></div>}
          <div className="flex justify-between font-bold border-t border-slate-200 pt-1"><span>Estimated total</span><span>{inr(material + freight)}</span></div>
          <div className="text-xs text-slate-500">Payment and delivery are arranged directly with the seller after they accept.</div>
        </div>
        <div className="flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Send order</Button>
        </div>
      </form>
    </Modal>
  );
}
