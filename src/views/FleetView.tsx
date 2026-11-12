import React, { useState } from 'react';
import { Plus, Truck } from 'lucide-react';
import { api } from '../api';
import { inr, num } from '../lib/format';
import type { Vehicle, VehicleCategory } from '../types';
import { Badge, Button, Card, Empty, ErrorBox, Field, Input, Loading, Modal, NumberInput, PageHeader, Select, useLoad, useToast } from '../components/ui';

/** Typical payloads, used only to prefill the form. The owner enters the real figure. */
const DEFAULT_CAPACITY: Record<VehicleCategory, number> = {
  'Tractor Trolley': 3,
  'Tata 407 (Medium)': 4,
  '6-Wheeler Tipper': 9,
  '10-Wheeler Heavy Tipper': 16,
};

export function FleetView() {
  const list = useLoad(() => api.get<Vehicle[]>('/vehicles'));
  const [adding, setAdding] = useState(false);
  const toast = useToast();

  const toggle = async (v: Vehicle) => {
    try {
      await api.patch(`/vehicles/${v.id}`, { active: !v.active });
      list.reload();
    } catch (e: any) {
      toast(e.message, 'error');
    }
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader
        title="My fleet"
        subtitle="Vehicles you can assign to pickup jobs. Your rates are used to suggest a fair transport fee when you accept a job."
        action={<Button onClick={() => setAdding(true)}><Plus className="w-4 h-4" /> Add vehicle</Button>}
      />
      {list.loading ? (
        <Loading />
      ) : list.error ? (
        <ErrorBox message={list.error} onRetry={list.reload} />
      ) : !list.data!.length ? (
        <Empty icon={<Truck className="w-5 h-5" />} title="No vehicles yet">
          Add your first tipper or tractor trolley to start accepting pickup jobs.
        </Empty>
      ) : (
        <div className="grid gap-3">
          {list.data!.map((v) => (
            <Card key={v.id} className="p-4 flex flex-wrap items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{v.registration}</span>
                  {v.active ? <Badge tone="green">Available</Badge> : <Badge>Off duty</Badge>}
                </div>
                <div className="text-sm text-slate-600">
                  {v.category} · {num(v.capacity_t)} t payload · driver {v.driver_name} ({v.driver_phone})
                </div>
                <div className="text-xs text-slate-500">
                  {inr(v.base_fare)} per trip + {inr(v.rate_per_km)}/km
                </div>
              </div>
              <Button size="sm" variant="secondary" onClick={() => toggle(v)}>
                {v.active ? 'Mark off duty' : 'Mark available'}
              </Button>
            </Card>
          ))}
        </div>
      )}
      {adding && (
        <AddVehicle
          onClose={() => setAdding(false)}
          onAdded={() => {
            setAdding(false);
            list.reload();
            toast('Vehicle added.');
          }}
        />
      )}
    </div>
  );
}

function AddVehicle({ onClose, onAdded }: { onClose: () => void; onAdded: () => void }) {
  const [category, setCategory] = useState<VehicleCategory>('6-Wheeler Tipper');
  const [registration, setRegistration] = useState('');
  const [capacity, setCapacity] = useState<number | ''>(DEFAULT_CAPACITY['6-Wheeler Tipper']);
  const [baseFare, setBaseFare] = useState<number | ''>('');
  const [rate, setRate] = useState<number | ''>('');
  const [driverName, setDriverName] = useState('');
  const [driverPhone, setDriverPhone] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await api.post('/vehicles', {
        category,
        registration,
        capacity_t: Number(capacity),
        base_fare: Number(baseFare || 0),
        rate_per_km: Number(rate || 0),
        driver_name: driverName,
        driver_phone: driverPhone,
      });
      onAdded();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Modal title="Add vehicle" onClose={onClose}>
      <form onSubmit={submit} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Field label="Vehicle type" className="sm:col-span-2">
          <Select
            value={category}
            onChange={(e) => {
              const c = e.target.value as VehicleCategory;
              setCategory(c);
              setCapacity(DEFAULT_CAPACITY[c]);
            }}
          >
            {Object.keys(DEFAULT_CAPACITY).map((c) => (
              <option key={c}>{c}</option>
            ))}
          </Select>
        </Field>
        <Field label="Registration number">
          <Input required value={registration} onChange={(e) => setRegistration(e.target.value)} placeholder="MH 15 AB 1234" />
        </Field>
        <Field label="Payload (tonnes)" hint="Legal payload, not gross vehicle weight">
          <NumberInput required min={0.5} max={60} step={0.5} value={capacity} onChange={setCapacity} />
        </Field>
        <Field label="Fixed charge per trip (₹)">
          <NumberInput required min={0} value={baseFare} onChange={setBaseFare} />
        </Field>
        <Field label="Rate per km (₹)">
          <NumberInput required min={0} value={rate} onChange={setRate} />
        </Field>
        <Field label="Driver name">
          <Input required value={driverName} onChange={(e) => setDriverName(e.target.value)} />
        </Field>
        <Field label="Driver phone">
          <Input required type="tel" value={driverPhone} onChange={(e) => setDriverPhone(e.target.value)} />
        </Field>
        {error && <div className="sm:col-span-2 text-sm text-red-700 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</div>}
        <div className="sm:col-span-2 flex justify-end gap-2">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" busy={busy}>Add vehicle</Button>
        </div>
      </form>
    </Modal>
  );
}
