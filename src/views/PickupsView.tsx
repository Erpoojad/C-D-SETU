import React, { useMemo, useState } from 'react';
import { CheckCircle2, Circle, FileText, MapPin, Phone, Plus, Truck } from 'lucide-react';
import { api } from '../api';
import { navigate, useRoute, useSession } from '../lib/session';
import { MATERIALS, PICKUP_STATUS_LABELS, dateTime, inr, materialLabel, num, timeAgo } from '../lib/format';
import { roadKm } from '../lib/geo';
import { salvageValueInr } from '../lib/cdFactors';
import type { Facility, MaterialCategory, Pickup, PickupStatus, Vehicle } from '../types';
import {
  Badge, Button, Card, Checkbox, Empty, ErrorBox, Field, Input, Loading, Modal, NumberInput, PageHeader, Select, Textarea, useLoad, useToast,
} from '../components/ui';
import { LocationPicker } from '../components/LocationPicker';
import { MapView } from '../components/MapView';

const STEPS: PickupStatus[] = ['requested', 'scheduled', 'en_route', 'picked_up', 'completed'];
const tone = (s: PickupStatus) =>
  s === 'completed' ? 'green' : s === 'cancelled' ? 'slate' : s === 'requested' ? 'amber' : ('blue' as const);

export function PickupsView() {
  const { user } = useSession();
  const route = useRoute();
  const role = user!.role;
  const [cityFilter, setCityFilter] = useState(user!.city);
  const [tab, setTab] = useState<'open' | 'mine'>(role === 'transporter' ? 'open' : 'mine');
  const showNew = route.query.get('new') === '1';

  const scope = role === 'transporter' ? tab : role === 'authority' ? 'city' : role === 'recycler' ? 'facility' : 'mine';
  const list = useLoad(
    () => api.get<Pickup[]>(`/pickups?scope=${scope}${scope === 'open' ? `&city=${encodeURIComponent(cityFilter)}` : ''}`),
    [scope, scope === 'open' ? cityFilter : ''],
  );

  const canRequest = role !== 'transporter';
  const title =
    role === 'transporter' ? 'Pickup jobs' : role === 'authority' ? `Pickups in ${user!.city}` : role === 'recycler' ? 'Incoming loads' : 'My pickups';
  const subtitle =
    role === 'transporter'
      ? 'Accept requests in your city, then update each step from the site to the weighbridge.'
      : role === 'authority'
        ? 'Every pickup requested in your city, with transporter, destination and manifest.'
        : role === 'recycler'
          ? 'Loads that transporters are bringing to your registered facilities.'
          : 'Request a transporter for your debris and follow it to a verified manifest.';

  const onChanged = (p: Pickup) => list.setData((list.data ?? []).map((x) => (x.id === p.id ? p : x)).filter((x) => !(scope === 'open' && x.status !== 'requested')));

  const mapped = (list.data ?? []).filter((p) => p.lat != null && p.lng != null);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title={title}
        subtitle={subtitle}
        action={
          canRequest && (
            <Button onClick={() => navigate('/pickups', { new: 1 })}>
              <Plus className="w-4 h-4" /> Request pickup
            </Button>
          )
        }
      />

      {role === 'transporter' && (
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="inline-flex p-1 bg-slate-100 rounded-lg">
            {(['open', 'mine'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-md ${tab === t ? 'bg-white shadow-sm text-slate-900' : 'text-slate-600'}`}
              >
                {t === 'open' ? 'Open requests' : 'My jobs'}
              </button>
            ))}
          </div>
          {tab === 'open' && (
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600">City</span>
              <Input className="w-40" value={cityFilter} onChange={(e) => setCityFilter(e.target.value)} />
            </div>
          )}
        </div>
      )}

      {mapped.length > 0 && (
        <div className="mb-6">
          <MapView
            height={260}
            markers={mapped.map((p) => ({ id: p.id, lat: p.lat!, lng: p.lng!, label: `${p.site_name} · ${num(p.estimated_tons)} t`, color: p.status === 'requested' ? '#d97706' : '#059669' }))}
          />
        </div>
      )}

      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox message={list.error} onRetry={list.reload} />
      ) : list.data!.length === 0 ? (
        <Empty icon={<Truck className="w-5 h-5" />} title={scope === 'open' ? `No open requests in ${cityFilter}` : 'No pickups yet'}>
          {scope === 'open'
            ? 'New requests from generators in this city appear here.'
            : canRequest
              ? 'Request your first pickup and local transporters will be able to accept it.'
              : role === 'transporter'
                ? 'Accept an open request to start a job.'
                : 'Loads routed to your facilities will appear here.'}
        </Empty>
      ) : (
        <div className="space-y-4">
          {list.data!.map((p) => (
            <PickupCard key={p.id} p={p} onChanged={onChanged} />
          ))}
        </div>
      )}

      {showNew && (
        <NewPickupModal
          initial={{
            tons: Number(route.query.get('tons')) || '',
            material: (route.query.get('material') as MaterialCategory) || 'concrete',
            segregated: route.query.get('segregated') === '1',
          }}
          onClose={() => navigate('/pickups')}
          onCreated={(p) => {
            list.setData([p, ...(list.data ?? [])]);
            navigate('/pickups');
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------ card ------------------------------ */

function PickupCard({ p, onChanged }: { p: Pickup; onChanged: (p: Pickup) => void }) {
  const { user } = useSession();
  const toast = useToast();
  const [busy, setBusy] = useState(false);
  const [modal, setModal] = useState<null | 'accept' | 'pickedup' | 'complete'>(null);
  const isGenerator = p.generator_id === user!.id;
  const isTransporter = p.transporter_id === user!.id;
  const stepIdx = STEPS.indexOf(p.status);

  const act = async (body: object, done: string) => {
    setBusy(true);
    try {
      onChanged(await api.patch<Pickup>(`/pickups/${p.id}`, body));
      toast(done);
      setModal(null);
    } catch (e: any) {
      toast(e.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  const payout = p.transport_fee != null ? p.estimated_salvage_inr - p.transport_fee : null;

  return (
    <Card className="p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-bold text-slate-900">{p.site_name}</h3>
            <Badge tone={tone(p.status)}>{PICKUP_STATUS_LABELS[p.status]}</Badge>
            <Badge tone={p.segregated ? 'green' : 'amber'}>{p.segregated ? 'Segregated' : 'Mixed'}</Badge>
          </div>
          <div className="text-sm text-slate-600 mt-1 flex items-center gap-1">
            <MapPin className="w-3.5 h-3.5 shrink-0" /> {p.address}, {p.city}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            {num(p.estimated_tons)} t {materialLabel(p.material)} · requested {timeAgo(p.created_at)} by {p.generator_company || p.generator_name}
            {p.preferred_time && ` · preferred ${dateTime(p.preferred_time)}`}
          </div>
        </div>
        <div className="text-right text-sm">
          <div className="text-xs text-slate-500">Est. salvage value</div>
          <div className="font-bold text-emerald-700">{inr(p.estimated_salvage_inr)}</div>
          {p.transport_fee != null && (
            <>
              <div className="text-xs text-slate-500 mt-1">Transport fee {inr(p.transport_fee)}</div>
              {isGenerator && payout != null && (
                <div className={`text-xs font-semibold ${payout >= 0 ? 'text-emerald-700' : 'text-slate-700'}`}>
                  Net {payout >= 0 ? 'credit' : 'cost'} {inr(Math.abs(payout))}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {p.status !== 'cancelled' && (
        <ol className="flex items-center gap-1 mt-4 overflow-x-auto">
          {STEPS.map((s, i) => (
            <li key={s} className="flex items-center gap-1 shrink-0">
              {i <= stepIdx ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4 text-slate-300" />}
              <span className={`text-xs ${i <= stepIdx ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>{PICKUP_STATUS_LABELS[s]}</span>
              {i < STEPS.length - 1 && <span className="w-6 h-px bg-slate-300 mx-1" />}
            </li>
          ))}
        </ol>
      )}

      <div className="grid sm:grid-cols-3 gap-3 mt-4 text-sm">
        {p.transporter_id && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs font-bold text-slate-500 uppercase">Transporter</div>
            <div className="font-semibold text-slate-900">{p.transporter_company || p.transporter_name}</div>
            <div className="text-xs text-slate-600">
              {p.vehicle_category} · {p.vehicle_registration}
            </div>
            {p.driver_name && (
              <a href={`tel:${p.driver_phone}`} className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1 mt-1">
                <Phone className="w-3 h-3" /> {p.driver_name} {p.driver_phone}
              </a>
            )}
          </div>
        )}
        {(isTransporter || user!.role === 'authority' || p.facility_owner_id === user!.id) && p.generator_phone && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs font-bold text-slate-500 uppercase">Site contact</div>
            <div className="font-semibold text-slate-900">{p.generator_name}</div>
            <a href={`tel:${p.generator_phone}`} className="text-xs text-emerald-700 font-semibold inline-flex items-center gap-1">
              <Phone className="w-3 h-3" /> {p.generator_phone}
            </a>
          </div>
        )}
        {p.facility_name && (
          <div className="p-3 bg-slate-50 rounded-lg">
            <div className="text-xs font-bold text-slate-500 uppercase">Destination</div>
            <div className="font-semibold text-slate-900">{p.facility_name}</div>
            <div className="text-xs text-slate-600">{p.facility_address}</div>
          </div>
        )}
        {p.net_t != null && (
          <div className="p-3 bg-emerald-50 rounded-lg">
            <div className="text-xs font-bold text-emerald-800 uppercase">Weighbridge</div>
            <div className="font-semibold text-slate-900">{num(p.net_t, 2)} t net</div>
            {p.gross_t != null && <div className="text-xs text-slate-600">Gross {num(p.gross_t, 2)} t − tare {num(p.tare_t, 2)} t</div>}
            {p.co2_avoided_kg != null && <div className="text-xs text-emerald-700">{num(p.co2_avoided_kg, 0)} kg CO₂ avoided</div>}
          </div>
        )}
      </div>

      {p.notes && <p className="text-sm text-slate-600 mt-3 italic">“{p.notes}”</p>}

      <div className="flex flex-wrap gap-2 mt-4">
        {user!.role === 'transporter' && p.status === 'requested' && <Button onClick={() => setModal('accept')}>Accept job</Button>}
        {isTransporter && p.status === 'scheduled' && (
          <>
            <Button busy={busy} onClick={() => act({ action: 'en_route' }, 'Marked en route. The generator can see the truck is coming.')}>
              Start: truck en route
            </Button>
            <Button variant="danger" busy={busy} onClick={() => act({ action: 'release' }, 'Job released back to the open list.')}>
              Release job
            </Button>
          </>
        )}
        {isTransporter && p.status === 'en_route' && <Button onClick={() => setModal('pickedup')}>Mark picked up</Button>}
        {isTransporter && p.status === 'picked_up' && <Button onClick={() => setModal('complete')}>Delivered: issue manifest</Button>}
        {isGenerator && ['requested', 'scheduled'].includes(p.status) && (
          <Button variant="danger" busy={busy} onClick={() => confirm('Cancel this pickup request?') && act({ action: 'cancel' }, 'Pickup cancelled.')}>
            Cancel request
          </Button>
        )}
        {p.manifest_no && (
          <Button variant="secondary" onClick={() => navigate(`/manifest/${p.manifest_no}`)}>
            <FileText className="w-4 h-4" /> Manifest {p.manifest_no}
          </Button>
        )}
      </div>

      {modal === 'accept' && <AcceptModal p={p} busy={busy} onClose={() => setModal(null)} onSubmit={(b) => act(b, 'Job accepted. Call the site contact to confirm timing.')} />}
      {modal === 'pickedup' && <PickedUpModal busy={busy} onClose={() => setModal(null)} onSubmit={(b) => act(b, 'Load marked as picked up.')} />}
      {modal === 'complete' && <CompleteModal p={p} busy={busy} onClose={() => setModal(null)} onSubmit={(b) => act(b, 'Delivered. Manifest issued.')} />}
    </Card>
  );
}

/* ------------------------------ new request ------------------------------ */

function NewPickupModal({
  initial,
  onClose,
  onCreated,
}: {
  initial: { tons: number | ''; material: MaterialCategory; segregated: boolean };
  onClose: () => void;
  onCreated: (p: Pickup) => void;
}) {
  const { user } = useSession();
  const toast = useToast();
  const [f, setF] = useState({
    site_name: '',
    address: '',
    city: user!.city,
    lat: null as number | null,
    lng: null as number | null,
    material: initial.material,
    segregated: initial.segregated,
    estimated_tons: initial.tons as number | '',
    preferred_time: '',
    notes: '',
  });
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF({ ...f, [k]: v });
  const salvage = f.estimated_tons ? salvageValueInr(f.material, Number(f.estimated_tons), f.segregated) : 0;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    try {
      const p = await api.post<Pickup>('/pickups', {
        ...f,
        estimated_tons: Number(f.estimated_tons),
        preferred_time: f.preferred_time ? new Date(f.preferred_time).toISOString() : null,
      });
      toast('Pickup requested. Transporters in your city can now accept it.');
      onCreated(p);
    } catch (err: any) {
      toast(err.message, 'error');
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Request a pickup" onClose={onClose} wide>
      <form onSubmit={submit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <Field label="Site name">
            <Input required value={f.site_name} onChange={(e) => set('site_name', e.target.value)} placeholder="e.g. Patil bungalow demolition" />
          </Field>
          <Field label="City">
            <Input required value={f.city} onChange={(e) => set('city', e.target.value)} />
          </Field>
          <Field label="Address / landmark" className="sm:col-span-2">
            <Input required value={f.address} onChange={(e) => set('address', e.target.value)} />
          </Field>
          <Field label="Main material">
            <Select value={f.material} onChange={(e) => set('material', e.target.value as MaterialCategory)}>
              {MATERIALS.map((m) => (
                <option key={m} value={m}>
                  {materialLabel(m)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estimated quantity (tonnes)" hint="Not sure? Use the scanner or calculator first.">
            <NumberInput required min={0.1} step={0.1} value={f.estimated_tons} onChange={(v) => set('estimated_tons', v)} />
          </Field>
          <Field label="Preferred pickup time (optional)">
            <Input type="datetime-local" value={f.preferred_time} onChange={(e) => set('preferred_time', e.target.value)} />
          </Field>
          <div className="flex items-end pb-2">
            <Checkbox
              checked={f.segregated}
              onChange={(v) => set('segregated', v)}
              label={<span>Load is <b>segregated</b> (one material, no plastic or household waste)</span>}
            />
          </div>
        </div>
        <Field label="Notes for the transporter (optional)">
          <Textarea value={f.notes} onChange={(e) => set('notes', e.target.value)} placeholder="Access road width, loading help available, gate timings…" />
        </Field>
        <LocationPicker lat={f.lat} lng={f.lng} onChange={(lat, lng) => setF({ ...f, lat, lng })} />
        <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-slate-100">
          <div className="text-sm text-slate-600">
            Estimated salvage value: <b className="text-emerald-700">{inr(salvage)}</b>
            {!f.segregated && <span className="block text-xs text-amber-700">Mixed loads earn no salvage credit. Segregate to get paid.</span>}
          </div>
          <Button type="submit" busy={busy}>
            Request pickup
          </Button>
        </div>
      </form>
    </Modal>
  );
}

/* ------------------------------ transporter modals ------------------------------ */

function useFacilities(city: string, material?: MaterialCategory, from?: { lat: number | null; lng: number | null }) {
  const { data } = useLoad(() => api.get<Facility[]>(`/facilities?city=${encodeURIComponent(city)}`), [city]);
  return useMemo(() => {
    const list = (data ?? []).map((f) => ({
      ...f,
      km: from?.lat != null && from.lng != null && f.lat != null && f.lng != null ? roadKm(from.lat, from.lng, f.lat, f.lng) : null,
      accepts: material ? f.accepted_materials.includes(material) : true,
    }));
    return list.sort((a, b) => Number(b.accepts) - Number(a.accepts) || (a.km ?? 1e9) - (b.km ?? 1e9));
  }, [data, material, from?.lat, from?.lng]);
}

function AcceptModal({ p, busy, onClose, onSubmit }: { p: Pickup; busy: boolean; onClose: () => void; onSubmit: (b: object) => void }) {
  const vehicles = useLoad(() => api.get<Vehicle[]>('/vehicles'));
  const facilities = useFacilities(p.city, p.material, p);
  const active = (vehicles.data ?? []).filter((v) => v.active);
  const [vehicleId, setVehicleId] = useState('');
  const [facilityId, setFacilityId] = useState('');
  const [fee, setFee] = useState<number | ''>('');

  const vehicle = active.find((v) => v.id === (vehicleId || active[0]?.id));
  const facility = facilities.find((f) => f.id === (facilityId || facilities.find((x) => x.accepts)?.id));
  const trips = vehicle ? Math.ceil(p.estimated_tons / vehicle.capacity_t) : 0;
  // Each trip: drive loaded to the facility and back.
  const suggested = vehicle ? Math.round(trips * (vehicle.base_fare + (facility?.km ?? 0) * 2 * vehicle.rate_per_km)) : 0;

  if (vehicles.loading) return <Modal title="Accept job" onClose={onClose}><Loading /></Modal>;
  if (!active.length)
    return (
      <Modal title="Accept job" onClose={onClose}>
        <p className="text-sm text-slate-600">Add a vehicle to your fleet before accepting jobs, so the site knows which truck and driver to expect.</p>
        <Button className="mt-4" onClick={() => navigate('/fleet')}>Add a vehicle</Button>
      </Modal>
    );

  return (
    <Modal title={`Accept: ${p.site_name}`} onClose={onClose}>
      <div className="space-y-4">
        <Field label="Vehicle">
          <Select value={vehicle?.id} onChange={(e) => setVehicleId(e.target.value)}>
            {active.map((v) => (
              <option key={v.id} value={v.id}>
                {v.category} · {v.registration} · {v.capacity_t} t · {v.driver_name}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Destination facility" hint={facilities.length ? 'Sorted: accepts this material first, then nearest.' : `No facilities registered in ${p.city} yet. You can choose one on delivery.`}>
          <Select value={facility?.id ?? ''} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="">Decide later</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
                {f.km != null ? ` · ${f.km} km` : ''}
                {f.accepts ? '' : ' · does not list this material'}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Your transport fee (₹)" hint={vehicle ? `${trips} trip(s) of ${num(vehicle.capacity_t)} t. Suggested from your rates: ${inr(suggested)}` : undefined}>
          <NumberInput min={0} value={fee === '' ? suggested : fee} onChange={setFee} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Back</Button>
          <Button
            busy={busy}
            onClick={() => onSubmit({ action: 'accept', vehicle_id: vehicle!.id, facility_id: facility?.id ?? null, transport_fee: Number(fee === '' ? suggested : fee) })}
          >
            Accept job
          </Button>
        </div>
      </div>
    </Modal>
  );
}

function PickedUpModal({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (b: object) => void }) {
  const [gross, setGross] = useState<number | ''>('');
  const [tare, setTare] = useState<number | ''>('');
  return (
    <Modal title="Load picked up" onClose={onClose}>
      <p className="text-sm text-slate-600 mb-4">If you passed a weighbridge, enter the slip weights now. You can also enter the net weight at delivery.</p>
      <div className="grid grid-cols-2 gap-4">
        <Field label="Gross weight (t)"><NumberInput min={0} step={0.01} value={gross} onChange={setGross} /></Field>
        <Field label="Tare weight (t)"><NumberInput min={0} step={0.01} value={tare} onChange={setTare} /></Field>
      </div>
      {gross !== '' && tare !== '' && <div className="text-sm text-slate-700 mt-3">Net: <b>{num(Number(gross) - Number(tare), 2)} t</b></div>}
      <div className="flex justify-end gap-2 mt-5">
        <Button variant="secondary" onClick={onClose}>Back</Button>
        <Button busy={busy} onClick={() => onSubmit({ action: 'picked_up', gross_t: gross === '' ? null : gross, tare_t: tare === '' ? null : tare })}>
          Confirm pickup
        </Button>
      </div>
    </Modal>
  );
}

function CompleteModal({ p, busy, onClose, onSubmit }: { p: Pickup; busy: boolean; onClose: () => void; onSubmit: (b: object) => void }) {
  const facilities = useFacilities(p.city, p.material, p);
  const fromSlip = p.gross_t != null && p.tare_t != null ? Math.round((p.gross_t - p.tare_t) * 100) / 100 : null;
  const [net, setNet] = useState<number | ''>(fromSlip ?? '');
  const [facilityId, setFacilityId] = useState(p.facility_id ?? '');
  return (
    <Modal title="Delivered: issue manifest" onClose={onClose}>
      <div className="space-y-4">
        <Field label="Delivered to">
          <Select required value={facilityId} onChange={(e) => setFacilityId(e.target.value)}>
            <option value="" disabled>Choose facility</option>
            {facilities.map((f) => (
              <option key={f.id} value={f.id}>{f.name}{f.km != null ? ` · ${f.km} km` : ''}</option>
            ))}
          </Select>
        </Field>
        {!facilities.length && <p className="text-xs text-amber-700">No facility is registered in {p.city}. Ask the plant to register on C&amp;D Setu so the manifest can name it.</p>}
        <Field label="Net weight (t)" hint="From the weighbridge slip at the facility.">
          <NumberInput required min={0.01} step={0.01} value={net} onChange={setNet} />
        </Field>
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose}>Back</Button>
          <Button busy={busy} disabled={!facilityId || !net} onClick={() => onSubmit({ action: 'complete', facility_id: facilityId, net_t: Number(net) })}>
            Issue manifest
          </Button>
        </div>
      </div>
    </Modal>
  );
}
